import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { getOnThisDayDateLimit } from '@/lib/paywall'

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
    const todayParam = searchParams.get('today') // Client's local "today" date

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    const [year, month, day] = dateParam.split('-')
    const monthNum = parseInt(month)
    const dayNum = parseInt(day)

    console.log('[today-data] Fetching data for date:', dateParam, 'today:', todayParam)

    // Run queries in parallel using Supabase
    const [entriesResult, existingEntryResult, friendsResult] = await Promise.all([
      // Get all entries for streak + on-this-day
      supabase
        .from('entries')
        .select('id, date, songTitle, artist, albumArt, notes')
        .eq('userId', prismaUserId)
        .order('date', { ascending: false }),

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

    if (entriesResult.error) {
      console.error('[today-data] Entries query error:', entriesResult.error)
      throw entriesResult.error
    }

    const allEntries = entriesResult.data || []
    console.log('[today-data] Found entries:', allEntries.length)

    // Calculate streak - use todayParam if provided (client's local today), otherwise use server date
    let currentStreak = 0
    if (allEntries.length > 0) {
      // Parse the "today" date from client (in YYYY-MM-DD format)
      const todayDateStr = todayParam || new Date().toISOString().split('T')[0]
      const [todayYear, todayMonth, todayDay] = todayDateStr.split('-').map(Number)
      const today = new Date(todayYear, todayMonth - 1, todayDay, 0, 0, 0, 0)

      const entryDates = new Set(
        allEntries.map((entry) => {
          const entryDate = new Date(entry.date)
          // Normalize entry date to midnight local time
          const normalizedDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate(), 0, 0, 0, 0)
          return normalizedDate.getTime()
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

    // Filter on-this-day entries - apply date limit for free users
    const dateLimit = await getOnThisDayDateLimit(clerkUserId)
    const onThisDayEntries = allEntries
      .filter((entry) => {
        const entryDate = new Date(entry.date)
        const entryYear = entryDate.getFullYear()
        
        // Check date limit for free users
        if (dateLimit && entryDate < dateLimit) {
          return false
        }
        
        return (
          entryDate.getMonth() + 1 === monthNum &&
          entryDate.getDate() === dayNum &&
          entryYear !== parseInt(year)
        )
      })
      .map((entry) => ({
        id: entry.id,
        date: new Date(entry.date).toISOString().split('T')[0],
        songTitle: entry.songTitle || '',
        artist: entry.artist || '',
        albumArt: entry.albumArt || null,
      }))

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
