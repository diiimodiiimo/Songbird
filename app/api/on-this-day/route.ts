import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prismaUserId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!prismaUserId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || prismaUserId
    const dateParam = searchParams.get('date')

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    const [, month, day] = dateParam.split('-')
    const monthNum = parseInt(month)
    const dayNum = parseInt(day)

    const supabase = getSupabase()

    const { data: allEntries, error } = await supabase
      .from('entries')
      .select('id, date, songTitle, artist, albumArt, notes')
      .eq('userId', userId)
      .order('date', { ascending: false })
      .limit(5000)

    if (error) throw error

    // Filter entries where month/day matches
    const entries = (allEntries || []).filter((entry) => {
      const entryDate = new Date(entry.date)
      return entryDate.getMonth() + 1 === monthNum && entryDate.getDate() === dayNum
    })

    // Get person references
    const entryIds = entries.map(e => e.id)
    let personRefs: any[] = []
    if (entryIds.length > 0) {
      const { data } = await supabase
        .from('person_references')
        .select('entryId, id, name')
        .in('entryId', entryIds)
      personRefs = data || []
    }

    const personRefsByEntry = new Map<string, any[]>()
    personRefs.forEach((pr) => {
      const existing = personRefsByEntry.get(pr.entryId) || []
      existing.push({ id: pr.id, name: pr.name })
      personRefsByEntry.set(pr.entryId, existing)
    })

    const formattedEntries = entries.map((entry) => ({
      id: entry.id,
      date: new Date(entry.date).toISOString().split('T')[0],
      songTitle: entry.songTitle || '',
      artist: entry.artist || '',
      albumArt: entry.albumArt || null,
      notesPreview: entry.notes
        ? entry.notes.substring(0, 160) + (entry.notes.length > 160 ? '...' : '')
        : null,
      people: personRefsByEntry.get(entry.id) || [],
    }))

    return NextResponse.json({ entries: formattedEntries })
  } catch (error: any) {
    console.error('[on-this-day] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch on-this-day entries', message: error?.message },
      { status: 500 }
    )
  }
}
