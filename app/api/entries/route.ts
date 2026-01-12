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
    const targetUserId = searchParams.get('userId') || prismaUserId
    const date = searchParams.get('date')
    const excludeImages = searchParams.get('excludeImages') === 'true'
    const fetchAll = searchParams.get('all') === 'true' // New param to fetch ALL entries

    const page = Number(searchParams.get('page') || 1)
    // Allow higher page sizes, especially when fetching all or excluding images
    const maxPageSize = fetchAll ? 10000 : (excludeImages ? 5000 : 500)
    const pageSize = Math.min(Number(searchParams.get('pageSize') || 100), maxPageSize)
    const offset = (page - 1) * pageSize

    const supabase = getSupabase()

    if (date) {
      // Single-day view with full details
      const dateStr = date.includes('T') ? date.split('T')[0] : date
      const startOfDay = `${dateStr}T00:00:00.000Z`
      const endOfDay = `${dateStr}T23:59:59.999Z`

      const { data: entries, error } = await supabase
        .from('entries')
        .select(`
          id, date, songTitle, artist, albumTitle, albumArt, notes, userId,
          person_references (id, name, userId)
        `)
        .eq('userId', targetUserId)
        .gte('date', startOfDay)
        .lte('date', endOfDay)
        .order('date', { ascending: false })

      if (error) throw error

      // Get user info
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email, image')
        .eq('id', targetUserId)
        .single()

      const formattedEntries = (entries || []).map((entry: any) => ({
        id: entry.id,
        date: new Date(entry.date).toISOString().split('T')[0],
        songTitle: entry.songTitle,
        artist: entry.artist,
        albumTitle: entry.albumTitle,
        albumArt: entry.albumArt,
        notes: entry.notes,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image && !user.image.startsWith('data:image') ? user.image : null,
        } : null,
        tags: [],
        mentions: [],
        people: (entry.person_references || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          userId: p.userId,
        })),
      }))

      return NextResponse.json({
        entries: formattedEntries,
        page,
        pageSize,
        hasMore: false,
      })
    } else {
      // All entries (paginated or fetch all)
      const selectFields = excludeImages 
        ? 'id, date, songTitle, artist, albumTitle, notes'
        : 'id, date, songTitle, artist, albumTitle, albumArt, notes'

      let query = supabase
        .from('entries')
        .select(`${selectFields}, person_references (id, name)`)
        .eq('userId', targetUserId)
        .order('date', { ascending: false })

      // If fetching all, use high limit instead of pagination range
      if (fetchAll) {
        query = query.limit(10000) // Fetch ALL entries
      } else {
        query = query.range(offset, offset + pageSize - 1)
      }

      const { data: entries, error } = await query

      if (error) throw error
      
      console.log('[entries] Fetched:', entries?.length || 0, 'entries, fetchAll:', fetchAll, 'page:', page)

      // Get user info separately
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email, image')
        .eq('id', targetUserId)
        .single()

      const userInfo = user || { id: targetUserId, name: null, email: null, image: null }
      const userImage = userInfo.image && !userInfo.image.startsWith('data:image') ? userInfo.image : null

      const formattedEntries = (entries || []).map((entry: any) => ({
        id: entry.id,
        date: new Date(entry.date).toISOString().split('T')[0],
        songTitle: String(entry.songTitle || '').substring(0, 200),
        artist: String(entry.artist || '').substring(0, 200),
        albumTitle: String(entry.albumTitle || '').substring(0, 200),
        notes: entry.notes ? String(entry.notes).substring(0, 200) : null,
        albumArt: excludeImages ? null : entry.albumArt,
        user: {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          image: userImage,
        },
        tags: [],
        mentions: [],
        people: (entry.person_references || []).map((p: any) => ({
          id: p.id,
          name: p.name,
        })),
      }))

      return NextResponse.json({
        entries: formattedEntries,
        page,
        pageSize,
        hasMore: fetchAll ? false : (entries?.length || 0) === pageSize,
        totalFetched: entries?.length || 0,
      })
    }
  } catch (error: any) {
    console.error('[entries] GET error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch entries', message: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const {
      date,
      songTitle,
      artist,
      albumTitle,
      albumArt,
      durationMs,
      explicit,
      popularity,
      releaseDate,
      trackId,
      uri,
      notes,
      peopleNames = [],
    } = body

    if (!date || !songTitle || !artist) {
      return NextResponse.json(
        { error: 'Date, songTitle, and artist are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Parse date
    const dateStr = date.includes('T') ? date.split('T')[0] : date
    const targetDate = new Date(dateStr + 'T12:00:00.000Z')
    const startOfDay = `${dateStr}T00:00:00.000Z`
    const endOfDay = `${dateStr}T23:59:59.999Z`

    // Check if entry already exists
    const { data: existingEntry } = await supabase
      .from('entries')
      .select('id')
      .eq('userId', userId)
      .gte('date', startOfDay)
      .lte('date', endOfDay)
      .maybeSingle()

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Entry already exists for this date' },
        { status: 409 }
      )
    }

    // Create entry
    const { data: entry, error: createError } = await supabase
      .from('entries')
      .insert({
        userId,
        date: targetDate.toISOString(),
        songTitle,
        artist,
        albumTitle: albumTitle || '',
        albumArt: albumArt || '',
        durationMs: durationMs || 0,
        explicit: explicit || false,
        popularity: popularity || 0,
        releaseDate: releaseDate || null,
        trackId: trackId || '',
        uri: uri || '',
        notes: notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (createError) throw createError

    // Match people to users and create person references
    if (peopleNames && peopleNames.length > 0) {
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, name, username, email')

      const peopleToCreate = peopleNames
        .map((name: string) => name.trim())
        .filter((name: string) => name)
        .map((name: string) => {
          const matchedUser = (allUsers || []).find(
            (user: any) =>
              user.name?.toLowerCase() === name.toLowerCase() ||
              user.username?.toLowerCase() === name.toLowerCase() ||
              user.email?.toLowerCase().split('@')[0] === name.toLowerCase()
          )
          return {
            entryId: entry.id,
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
        ...entry,
        user,
        people: [],
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('[entries] POST error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to create entry', message: error?.message },
      { status: 500 }
    )
  }
}
