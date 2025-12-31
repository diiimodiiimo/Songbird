import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get notifications for current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: any = { userId: session.user.id }
    if (unreadOnly) {
      where.read = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    // Enrich notifications with related data
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let relatedData = null

        if (notification.type === 'mention' && notification.relatedId) {
          const entry = await prisma.entry.findUnique({
            where: { id: notification.relatedId },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  image: true,
                },
              },
            },
          })
          relatedData = entry
        } else if (
          notification.type === 'friend_request_accepted' &&
          notification.relatedId
        ) {
          const friendRequest = await prisma.friendRequest.findUnique({
            where: { id: notification.relatedId },
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
          relatedData = friendRequest
        }

        return {
          ...notification,
          relatedData,
        }
      })
    )

    return NextResponse.json({ notifications: enrichedNotifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds } = body

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds must be an array' },
        { status: 400 }
      )
    }

    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
        userId: session.user.id, // Ensure user can only mark their own notifications as read
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({ message: 'Notifications marked as read' })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}



