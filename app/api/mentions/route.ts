import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { areFriends } from '@/lib/friends'
import { z } from 'zod'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

const mentionSchema = z.object({
  entryId: z.string(),
  userId: z.string(),
})

// POST - Add a mention to an entry
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!currentUserId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const { entryId, userId: mentionedUserId } = mentionSchema.parse(body)

    const supabase = getSupabase()

    // Verify entry exists and belongs to current user
    const { data: entry } = await supabase
      .from('entries')
      .select('id, userId')
      .eq('id', entryId)
      .single()

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (entry.userId !== currentUserId) {
      return NextResponse.json(
        { error: 'You can only mention people in your own entries' },
        { status: 403 }
      )
    }

    // Check if users are friends
    const isFriend = await areFriends(currentUserId, mentionedUserId)
    if (!isFriend) {
      return NextResponse.json({ error: 'You can only mention friends' }, { status: 403 })
    }

    // Check if mention already exists
    const { data: existingMention } = await supabase
      .from('mentions')
      .select('id')
      .eq('entryId', entryId)
      .eq('userId', mentionedUserId)
      .maybeSingle()

    if (existingMention) {
      return NextResponse.json(
        { error: 'User already mentioned in this entry' },
        { status: 400 }
      )
    }

    // Create the mention with generated ID
    const mentionId = `mention_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const { data: mention, error } = await supabase
      .from('mentions')
      .insert({
        id: mentionId,
        entryId,
        userId: mentionedUserId,
        createdAt: new Date().toISOString(),
      })
      .select('id, entryId, userId')
      .single()

    if (error) throw error

    // Get mentioned user info
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, image')
      .eq('id', mentionedUserId)
      .single()

    // Create notification with generated ID
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    await supabase.from('notifications').insert({
      id: notifId,
      userId: mentionedUserId,
      type: 'mention',
      relatedId: entryId,
      read: false,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ mention: { ...mention, user } }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[mentions] POST Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to create mention', message: error?.message },
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

    const supabase = getSupabase()

    // Verify entry belongs to current user
    const { data: entry } = await supabase
      .from('entries')
      .select('id, userId')
      .eq('id', entryId)
      .single()

    if (!entry || entry.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only remove mentions from your own entries' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('mentions')
      .delete()
      .eq('entryId', entryId)
      .eq('userId', mentionedUserId)

    if (error) throw error

    return NextResponse.json({ message: 'Mention removed' })
  } catch (error: any) {
    console.error('[mentions] DELETE Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to remove mention', message: error?.message },
      { status: 500 }
    )
  }
}
