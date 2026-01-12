import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

const friendRequestSchema = z.object({
  receiverUsername: z.string().min(1).max(50),
})

// GET - List friend requests (sent and received)
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Convert Clerk user ID to Prisma user ID
    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // 'sent', 'received', 'all'

    const where: any = {}
    if (type === 'sent') {
      where.senderId = userId
    } else if (type === 'received') {
      where.receiverId = userId
    } else {
      // Get both sent and received
      where.OR = [
        { senderId: userId },
        { receiverId: userId },
      ]
    }

    const requests = await prisma.friendRequest.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching friend requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch friend requests' },
      { status: 500 }
    )
  }
}

// POST - Send a friend request
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Convert Clerk user ID to Prisma user ID
    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const { receiverUsername } = friendRequestSchema.parse(body)

    // Find the receiver user by username
    const receiver = await prisma.user.findUnique({
      where: { username: receiverUsername },
    })

    if (!receiver) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (receiver.id === userId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      )
    }

    // Check if a request already exists (in either direction)
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: receiver.id,
          },
          {
            senderId: receiver.id,
            receiverId: userId,
          },
        ],
      },
    })

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'Friend request already exists' },
          { status: 400 }
        )
      }
      if (existingRequest.status === 'accepted') {
        return NextResponse.json(
          { error: 'You are already friends' },
          { status: 400 }
        )
      }
    }

    // Create the friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: userId,
        receiverId: receiver.id,
        status: 'pending',
      },
      include: {
        receiver: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({ friendRequest }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating friend request:', error)
    return NextResponse.json(
      { error: 'Failed to create friend request' },
      { status: 500 }
    )
  }
}

