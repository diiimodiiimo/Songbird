import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRequestSchema = z.object({
  action: z.enum(['accept', 'decline']),
})

// PUT - Accept or decline a friend request
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = updateRequestSchema.parse(body)

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id },
    })

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      )
    }

    // Only the receiver can accept/decline
    if (friendRequest.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only respond to requests sent to you' },
        { status: 403 }
      )
    }

    if (friendRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Friend request has already been processed' },
        { status: 400 }
      )
    }

    // Update the request status
    const updatedRequest = await prisma.friendRequest.update({
      where: { id },
      data: {
        status: action === 'accept' ? 'accepted' : 'declined',
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

    // If accepted, create notification for the sender
    if (action === 'accept') {
      await prisma.notification.create({
        data: {
          userId: friendRequest.senderId,
          type: 'friend_request_accepted',
          relatedId: friendRequest.id,
        },
      })
    }

    return NextResponse.json({ friendRequest: updatedRequest })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating friend request:', error)
    return NextResponse.json(
      { error: 'Failed to update friend request' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel a friend request (only sender can cancel)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id },
    })

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      )
    }

    // Only the sender can cancel
    if (friendRequest.senderId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only cancel requests you sent' },
        { status: 403 }
      )
    }

    await prisma.friendRequest.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Friend request cancelled' })
  } catch (error) {
    console.error('Error deleting friend request:', error)
    return NextResponse.json(
      { error: 'Failed to cancel friend request' },
      { status: 500 }
    )
  }
}

