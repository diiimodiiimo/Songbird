import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { z } from 'zod'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

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
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { id } = await params
    const supabase = getSupabase()

    // Check entry exists and belongs to user
    const { data: entry } = await supabase
      .from('entries')
      .select('id, userId')
      .eq('id', id)
      .single()

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (entry.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateEntrySchema.parse(body)

    // Delete existing tags if updating
    if (data.taggedUserIds !== undefined) {
      await supabase.from('entry_tags').delete().eq('entryId', id)
    }

    // Delete existing people references if updating
    if (data.peopleNames !== undefined) {
      await supabase.from('person_references').delete().eq('entryId', id)
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    }
    if (data.songTitle) updateData.songTitle = data.songTitle
    if (data.artist) updateData.artist = data.artist
    if (data.albumTitle) updateData.albumTitle = data.albumTitle
    if (data.albumArt) updateData.albumArt = data.albumArt
    if (data.durationMs !== undefined) updateData.durationMs = data.durationMs
    if (data.explicit !== undefined) updateData.explicit = data.explicit
    if (data.popularity !== undefined) updateData.popularity = data.popularity
    if (data.releaseDate !== undefined) updateData.releaseDate = data.releaseDate
    if (data.trackId) updateData.trackId = data.trackId
    if (data.uri) updateData.uri = data.uri
    if (data.notes !== undefined) updateData.notes = data.notes

    const { data: updatedEntry, error: updateError } = await supabase
      .from('entries')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) throw updateError

    // Create new tags
    if (data.taggedUserIds && data.taggedUserIds.length > 0) {
      await supabase.from('entry_tags').insert(
        data.taggedUserIds.map((taggedUserId) => ({
          entryId: id,
          userId: taggedUserId,
          createdAt: new Date().toISOString(),
        }))
      )
    }

    // Create new people references
    if (data.peopleNames && data.peopleNames.length > 0) {
      // Match people to users
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, name, username, email')

      const peopleToCreate = data.peopleNames
        .map((name) => name.trim())
        .filter((name) => name)
        .map((name) => {
          const matchedUser = (allUsers || []).find(
            (user: any) =>
              user.name?.toLowerCase() === name.toLowerCase() ||
              user.username?.toLowerCase() === name.toLowerCase() ||
              user.email?.toLowerCase().split('@')[0] === name.toLowerCase()
          )
          return {
            id: `pref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            entryId: id,
            name,
            userId: matchedUser?.id || null,
            createdAt: new Date().toISOString(),
          }
        })

      if (peopleToCreate.length > 0) {
        await supabase.from('person_references').insert(peopleToCreate)
      }
    }

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, image')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      entry: {
        ...updatedEntry,
        date: new Date(updatedEntry.date).toISOString().split('T')[0],
        user,
        tags: [],
        mentions: [],
        people: [],
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[entries/[id]] PUT Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to update entry', message: error?.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { id } = await params
    const supabase = getSupabase()

    const { data: entry } = await supabase
      .from('entries')
      .select('id, userId')
      .eq('id', id)
      .single()

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (entry.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase.from('entries').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error: any) {
    console.error('[entries/[id]] DELETE Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to delete entry', message: error?.message },
      { status: 500 }
    )
  }
}
