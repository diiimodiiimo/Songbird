import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

// GET - Get song associations (songs you've associated with friends)
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get('friendId')

    const supabase = getSupabase()

    // Build query
    let query = supabase
      .from('song_associations')
      .select('id, friendId, songTitle, artist, albumTitle, albumArt, trackId, note, createdAt')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    // Filter by friend if specified
    if (friendId) {
      query = query.eq('friendId', friendId)
    }

    const { data: associations, error } = await query

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({ associations: [], tableNotFound: true })
      }
      throw error
    }

    return NextResponse.json({ associations: associations || [] })
  } catch (error: any) {
    console.error('[song-associations] GET error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch song associations', message: error?.message },
      { status: 500 }
    )
  }
}

// POST - Create a new song association
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { friendId, songTitle, artist, albumTitle, albumArt, trackId, note } = body

    if (!friendId || !songTitle || !artist) {
      return NextResponse.json(
        { error: 'friendId, songTitle, and artist are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Verify the friend exists and is actually a friend
    const { data: friendship } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(senderId.eq.${userId},receiverId.eq.${friendId}),and(senderId.eq.${friendId},receiverId.eq.${userId})`)
      .limit(1)
      .maybeSingle()

    if (!friendship) {
      return NextResponse.json(
        { error: 'You can only associate songs with friends' },
        { status: 403 }
      )
    }

    // Create the association
    const { data: association, error } = await supabase
      .from('song_associations')
      .insert({
        userId,
        friendId,
        songTitle,
        artist,
        albumTitle: albumTitle || null,
        albumArt: albumArt || null,
        trackId: trackId || null,
        note: note || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already associated this song with this friend' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ association }, { status: 201 })
  } catch (error: any) {
    console.error('[song-associations] POST error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to create song association', message: error?.message },
      { status: 500 }
    )
  }
}

// DELETE - Remove a song association
export async function DELETE(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const associationId = searchParams.get('id')

    if (!associationId) {
      return NextResponse.json({ error: 'Association ID is required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Delete only if owned by user
    const { error } = await supabase
      .from('song_associations')
      .delete()
      .eq('id', associationId)
      .eq('userId', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[song-associations] DELETE error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to delete song association', message: error?.message },
      { status: 500 }
    )
  }
}

