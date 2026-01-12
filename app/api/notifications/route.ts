import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

// GET - Get notifications for current user
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
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: any = { userId: userId }
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
        userId: userId, // Ensure user can only mark their own notifications as read
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





