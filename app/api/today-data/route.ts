import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

/**
 * OPTIMIZED: Combined endpoint for Today page data
 * Uses Supabase REST API (more reliable on Vercel than Prisma)
 */
export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    console.log('[today-data] Starting request')

    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      console.log('[today-data] No clerkUserId - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[today-data] Clerk userId:', clerkUserId)

    const supabase = getSupabase()

    let prismaUserId: string | null = null
    try {
      prismaUserId = await getPrismaUserIdFromClerk(clerkUserId)
    } catch (syncError: any) {
      console.error('[today-data] clerk-sync error:', syncError?.message)
      return NextResponse.json({
        error: 'Database connection error',
        message: syncError?.message || 'Failed to sync user',
      }, { status: 500 })
    }

    if (!prismaUserId) {
      console.log('[today-data] No prismaUserId found')
      return NextResponse.json({
        error: 'User not found in database',
      }, { status: 404 })
    }
    console.log('[today-data] Database userId:', prismaUserId)

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    const [year, month, day] = dateParam.split('-')
    const monthNum = parseInt(month)
    const dayNum = parseInt(day)

    console.log('[today-data] Fetching data for date:', dateParam)

    // Fetch ALL entries using pagination (separate from other queries)
    let allEntries: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: pageData, error: pageError } = await supabase
        .from('entries')
        .select('id, date, songTitle, artist, albumArt, notes')
        .eq('userId', prismaUserId)
        .order('date', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (pageError) throw pageError

      if (pageData && pageData.length > 0) {
        allEntries = [...allEntries, ...pageData]
        page++
        hasMore = pageData.length === pageSize
      } else {
        hasMore = false
      }
    }

    // Run other queries in parallel
    const [existingEntryResult, friendsResult] = await Promise.all([
      // Check for existing entry on selected date
      supabase
        .from('entries')
        .select(`
          id, songTitle, artist, notes,
          person_references (id, name)
        `)
        .eq('userId', prismaUserId)
        .gte('date', `${dateParam}T00:00:00.000Z`)
        .lte('date', `${dateParam}T23:59:59.999Z`)
        .maybeSingle(),

      // Get friends
      supabase
        .from('friend_requests')
        .select(`
          senderId, receiverId,
          sender:users!friend_requests_senderId_fkey(id, name, email),
          receiver:users!friend_requests_receiverId_fkey(id, name, email)
        `)
        .eq('status', 'accepted')
        .or(`senderId.eq.${prismaUserId},receiverId.eq.${prismaUserId}`),
    ])

    console.log('[today-data] Total entries for user:', allEntries.length)
    
    // Log the year range of entries for debugging
    if (allEntries.length > 0) {
      const years = new Set(allEntries.map(e => {
        const dateStr = typeof e.date === 'string' ? e.date.split('T')[0] : new Date(e.date).toISOString().split('T')[0]
        return parseInt(dateStr.split('-')[0])
      }))
      console.log('[today-data] Years with entries:', Array.from(years).sort())
    }

    // Calculate streak
    let currentStreak = 0
    if (allEntries.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const entryDates = new Set(
        allEntries.map((entry) => {
          const date = new Date(entry.date)
          date.setHours(0, 0, 0, 0)
          return date.getTime()
        })
      )

      let checkDate = new Date(today)
      if (!entryDates.has(checkDate.getTime())) {
        checkDate.setDate(checkDate.getDate() - 1)
      }

      while (entryDates.has(checkDate.getTime())) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }

    // Filter on-this-day entries - show ALL previous years (exclude current year only)
    // Use UTC methods to avoid timezone issues
    const onThisDayEntries = allEntries
      .filter((entry) => {
        // Parse the date string directly to avoid timezone issues
        const dateStr = typeof entry.date === 'string' ? entry.date.split('T')[0] : new Date(entry.date).toISOString().split('T')[0]
        const [entryYearStr, entryMonthStr, entryDayStr] = dateStr.split('-')
        const entryYear = parseInt(entryYearStr)
        const entryMonth = parseInt(entryMonthStr)
        const entryDay = parseInt(entryDayStr)
        
        const matches = entryMonth === monthNum && entryDay === dayNum && entryYear !== parseInt(year)
        if (matches) {
          console.log('[today-data] On This Day match:', entryYear, entry.songTitle)
        }
        return matches
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort newest first
      .map((entry) => ({
        id: entry.id,
        date: new Date(entry.date).toISOString().split('T')[0],
        songTitle: entry.songTitle || '',
        artist: entry.artist || '',
        albumArt: entry.albumArt || null,
      }))
    
    console.log('[today-data] On This Day entries found:', onThisDayEntries.length)

    // Format existing entry
    const existingEntry = existingEntryResult.data
      ? {
          id: existingEntryResult.data.id,
          songTitle: existingEntryResult.data.songTitle,
          artist: existingEntryResult.data.artist,
          notes: existingEntryResult.data.notes || '',
          people: (existingEntryResult.data.person_references || []).map((p: any) => ({
            id: p.id,
            name: p.name,
          })),
          mentions: [],
        }
      : null

    // Format friends list
    const friendsList = (friendsResult.data || []).map((fr: any) => {
      const friend = fr.senderId === prismaUserId ? fr.receiver : fr.sender
      return {
        id: friend?.id || '',
        name: friend?.name || friend?.email?.split('@')[0] || 'Unknown',
        email: friend?.email || '',
      }
    }).filter((f: any) => f.id)

    const duration = Date.now() - startTime
    console.log('[today-data] Completed in', duration, 'ms')

    return NextResponse.json({
      currentStreak,
      onThisDayEntries,
      existingEntry,
      friends: friendsList,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('[today-data] Error after', duration, 'ms:', error?.message || error)
    return NextResponse.json(
      {
        error: 'Failed to fetch today data',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
