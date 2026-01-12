import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!currentUserId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { username } = await params

    // Find the profile user
    const profileUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
        ],
      },
      select: { id: true },
    })

    if (!profileUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if it's the same user
    if (profileUser.id === currentUserId) {
      return NextResponse.json({ 
        isOwnProfile: true,
        isFriend: false,
        hasPendingRequest: false,
        requestDirection: null,
      })
    }

    // Check if they're friends
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: currentUserId,
            receiverId: profileUser.id,
          },
          {
            senderId: profileUser.id,
            receiverId: currentUserId,
          },
        ],
      },
    })

    if (!friendRequest) {
      return NextResponse.json({
        isOwnProfile: false,
        isFriend: false,
        hasPendingRequest: false,
        requestDirection: null,
      })
    }

    const isFriend = friendRequest.status === 'accepted'
    const hasPendingRequest = friendRequest.status === 'pending'
    const requestDirection = friendRequest.senderId === currentUserId ? 'sent' : 'received'

    return NextResponse.json({
      isOwnProfile: false,
      isFriend,
      hasPendingRequest,
      requestDirection,
      requestId: friendRequest.id,
    })
  } catch (error) {
    console.error('Error checking friendship status:', error)
    return NextResponse.json(
      { error: 'Failed to check friendship status' },
      { status: 500 }
    )
  }
}

