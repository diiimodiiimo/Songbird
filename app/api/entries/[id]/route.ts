import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateEntrySchema = z.object({
  songTitle: z.string().optional(),
  artist: z.string().optional(),
  albumTitle: z.string().optional(),
  albumArt: z.string().optional(),
  durationMs: z.number().optional(),
  explicit: z.boolean().optional(),
  popularity: z.number().optional(),
  releaseDate: z.string().optional(),
  trackId: z.string().optional(),
  uri: z.string().optional(),
  notes: z.string().optional(),
  taggedUserIds: z.array(z.string()).optional(),
  peopleNames: z.array(z.string()).optional(),
})

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
    const entry = await prisma.entry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (entry.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateEntrySchema.parse(body)

    // Delete existing tags and create new ones if provided
    if (data.taggedUserIds !== undefined) {
      await prisma.entryTag.deleteMany({
        where: { entryId: id },
      })
    }

    // Delete existing people references and create new ones if provided
    if (data.peopleNames !== undefined) {
      await prisma.personReference.deleteMany({
        where: { entryId: id },
      })
    }

    // Helper function to match people names to users
    const matchPeopleToUsers = async (peopleNames: string[]): Promise<Array<{ name: string; userId: string | null }>> => {
      if (!peopleNames || peopleNames.length === 0) return []
      
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      })
      
      // Group people by lowercase name to handle case-insensitive duplicates
      const nameMap = new Map<string, string>()
      peopleNames.forEach((name) => {
        const trimmed = name.trim()
        if (trimmed) {
          const lower = trimmed.toLowerCase()
          // Keep the first capitalization we see
          if (!nameMap.has(lower)) {
            nameMap.set(lower, trimmed)
          }
        }
      })

      return Array.from(nameMap.values()).map((trimmedName) => {
        const matchedUser = allUsers.find(
          (user) =>
            user.name?.toLowerCase() === trimmedName.toLowerCase() ||
            user.username?.toLowerCase() === trimmedName.toLowerCase() ||
            user.email.toLowerCase().split('@')[0] === trimmedName.toLowerCase()
        )
        
        return {
          name: trimmedName,
          userId: matchedUser?.id || null,
        }
      })
    }

    // Match people names to users if provided
    const peopleWithMatches = data.peopleNames !== undefined
      ? await matchPeopleToUsers(data.peopleNames)
      : []

    const updatedEntry = await prisma.entry.update({
      where: { id },
      data: {
        ...(data.songTitle && { songTitle: data.songTitle }),
        ...(data.artist && { artist: data.artist }),
        ...(data.albumTitle && { albumTitle: data.albumTitle }),
        ...(data.albumArt && { albumArt: data.albumArt }),
        ...(data.durationMs !== undefined && { durationMs: data.durationMs }),
        ...(data.explicit !== undefined && { explicit: data.explicit }),
        ...(data.popularity !== undefined && { popularity: data.popularity }),
        ...(data.releaseDate !== undefined && { releaseDate: data.releaseDate }),
        ...(data.trackId && { trackId: data.trackId }),
        ...(data.uri && { uri: data.uri }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.taggedUserIds !== undefined && {
          tags: {
            create: data.taggedUserIds.map((taggedUserId) => ({
              userId: taggedUserId,
            })),
          },
        }),
        ...(data.peopleNames !== undefined && {
          people: {
            create: peopleWithMatches.map((person) => ({
              name: person.name,
              userId: person.userId,
            })),
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        people: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    })

    // Format date consistently
    const formattedEntry = {
      ...updatedEntry,
      date: new Date(updatedEntry.date).toISOString().split('T')[0],
    }

    return NextResponse.json({ entry: formattedEntry })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating entry:', error)
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    )
  }
}

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
    const entry = await prisma.entry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (entry.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.entry.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    )
  }
}


