import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { areFriends } from '@/lib/friends'
import { z } from 'zod'

const mentionSchema = z.object({
  entryId: z.string(),
  userId: z.string(), // The user being mentioned
})

// POST - Add a mention to an entry
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entryId, userId } = mentionSchema.parse(body)

    // Verify the entry exists and belongs to the current user
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (entry.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only mention people in your own entries' },
        { status: 403 }
      )
    }

    // Check if users are friends (mentions only allowed between friends)
    const isFriend = await areFriends(session.user.id, userId)
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
          userId,
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
        userId,
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
        userId,
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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')
    const userId = searchParams.get('userId')

    if (!entryId || !userId) {
      return NextResponse.json(
        { error: 'entryId and userId are required' },
        { status: 400 }
      )
    }

    // Verify the entry belongs to the current user
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
    })

    if (!entry || entry.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only remove mentions from your own entries' },
        { status: 403 }
      )
    }

    await prisma.mention.delete({
      where: {
        entryId_userId: {
          entryId,
          userId,
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



