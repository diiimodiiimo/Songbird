import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

// GET - List all friends (accepted friend requests)
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

    // Get all accepted friend requests where user is either sender or receiver
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
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
    })

    // Extract friends (the other user in each accepted request)
    const friends = friendRequests.map((request) => {
      return request.senderId === userId
        ? request.receiver
        : request.sender
    })

    return NextResponse.json({ friends })
  } catch (error) {
    console.error('Error fetching friends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    )
  }
}





