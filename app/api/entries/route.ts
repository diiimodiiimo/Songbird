import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { canCreateEntry } from '@/lib/paywall'

// Generate a CUID-like ID
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `c${timestamp}${randomPart}`
}

/**
 * Get Supabase user ID directly from Clerk email
 * Bypasses Clerk ID mapping - goes straight to Supabase
 */
async function getSupabaseUserIdFromClerk(): Promise<string | null> {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
      console.error('[entries] No Clerk email found')
      return null
    }

    const email = clerkUser.emailAddresses[0].emailAddress
    const supabase = getSupabase()

    // Query Supabase directly by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('[entries] Supabase query error:', error)
      return null
    }

    if (!user) {
      console.error('[entries] User not found in Supabase for email:', email)
      return null
    }

    console.log('[entries] Found Supabase user:', user.id, 'for email:', email)
    return user.id
  } catch (error: any) {
    console.error('[entries] Error getting Supabase user:', error)
    return null
  }
}

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Rate limiting - check after auth to avoid unnecessary work
    const rateLimitResult = await checkRateLimit(clerkUserId, 'READ')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const prismaUserId = await getSupabaseUserIdFromClerk()
    if (!prismaUserId) {
      console.error('[entries] GET: Failed to get Supabase user ID')
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId') || prismaUserId
    const date = searchParams.get('date')
    const excludeImages = searchParams.get('excludeImages') === 'true'

    const page = Number(searchParams.get('page') || 1)
    const pageSize = Math.min(Number(searchParams.get('pageSize') || 100), excludeImages ? 1000 : 100)
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
      // All entries (paginated)
      const selectFields = excludeImages 
        ? 'id, date, songTitle, artist, albumTitle, notes'
        : 'id, date, songTitle, artist, albumTitle, albumArt, notes'

      const { data: entries, error } = await supabase
        .from('entries')
        .select(`${selectFields}, person_references (id, name)`)
        .eq('userId', targetUserId)
        .order('date', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (error) throw error

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
        hasMore: (entries?.length || 0) === pageSize,
      }, {
        headers: await getRateLimitHeaders(clerkUserId, 'READ'),
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
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(clerkUserId, 'WRITE')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getSupabaseUserIdFromClerk()
    if (!userId) {
      console.error('[entries] POST: Failed to get Supabase user ID')
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Check paywall: entry limit for free users
    const entryCheck = await canCreateEntry(clerkUserId)
    if (!entryCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Entry limit reached',
          message: entryCheck.reason,
          currentCount: entryCheck.currentCount,
          limit: entryCheck.limit,
          upgradeRequired: true,
        },
        { status: 403 }
      )
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
      mood,
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
        id: generateId(),
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
        mood: mood || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (createError) {
      console.error('[entries] POST: Create entry error:', {
        error: createError.message,
        code: createError.code,
        details: createError.details,
        userId,
        date: targetDate.toISOString(),
      })
      throw createError
    }

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
    }, { 
      status: 201,
      headers: await getRateLimitHeaders(clerkUserId, 'WRITE'),
    })
  } catch (error: any) {
    console.error('[entries] POST error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: 'Failed to create entry', 
        message: error?.message || 'Unknown error occurred',
        details: error?.details,
      },
      { status: 500 }
    )
  }
}
