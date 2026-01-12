import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { areFriends } from '@/lib/friends'
import { z } from 'zod'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

const mentionSchema = z.object({
  entryId: z.string(),
  userId: z.string(), // The user being mentioned (Prisma user ID)
})

// POST - Add a mention to an entry
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Convert Clerk user ID to Prisma user ID
    const currentUserId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!currentUserId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const { entryId, userId: mentionedUserId } = mentionSchema.parse(body)

    // Verify the entry exists and belongs to the current user
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (entry.userId !== currentUserId) {
      return NextResponse.json(
        { error: 'You can only mention people in your own entries' },
        { status: 403 }
      )
    }

    // Check if users are friends (mentions only allowed between friends)
    const isFriend = await areFriends(currentUserId, mentionedUserId)
    if (!isFriend) {
      return NextResponse.json(
        { error: 'You can only mention friends' },
        { status: 403 }
      )
    }

    // Check if mention already exists
    const existingMention = await prisma.mention.findUnique({
      where: {
        entryId_userId: {
          entryId,
          userId: mentionedUserId,
        },
      },
    })

    if (existingMention) {
      return NextResponse.json(
        { error: 'User already mentioned in this entry' },
        { status: 400 }
      )
    }

    // Create the mention
    const mention = await prisma.mention.create({
      data: {
        entryId,
        userId: mentionedUserId,
      },
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

    // Create notification for the mentioned user
    await prisma.notification.create({
      data: {
        userId: mentionedUserId,
        type: 'mention',
        relatedId: entryId,
      },
    })

    return NextResponse.json({ mention }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating mention:', error)
    return NextResponse.json(
      { error: 'Failed to create mention' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a mention
export async function DELETE(request: Request) {
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
    const entryId = searchParams.get('entryId')
    const mentionedUserId = searchParams.get('userId')

    if (!entryId || !mentionedUserId) {
      return NextResponse.json(
        { error: 'entryId and userId are required' },
        { status: 400 }
      )
    }

    // Verify the entry belongs to the current user
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
    })

    if (!entry || entry.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only remove mentions from your own entries' },
        { status: 403 }
      )
    }

    await prisma.mention.delete({
      where: {
        entryId_userId: {
          entryId,
          userId: mentionedUserId,
        },
      },
    })

    return NextResponse.json({ message: 'Mention removed' })
  } catch (error) {
    console.error('Error deleting mention:', error)
    return NextResponse.json(
      { error: 'Failed to remove mention' },
      { status: 500 }
    )
  }
}





