import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all friends (accepted friend requests)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all accepted friend requests where user is either sender or receiver
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
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
      return request.senderId === session.user.id
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



