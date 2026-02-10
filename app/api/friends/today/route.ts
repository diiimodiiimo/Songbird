import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getFriendIds } from '@/lib/friends'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

export async function GET(request: Request) {
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
    // Use the date parameter from client (which is in local timezone)
    // If not provided, default to server date (but this should rarely happen)
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get friend IDs
    const friendIds = await getFriendIds(userId)
    
    if (friendIds.length === 0) {
      return NextResponse.json({ friends: [] })
    }

    const supabase = getSupabase()

    // Get friends who logged on this date
    // The date parameter is already in YYYY-MM-DD format from the client
    const { data: entries, error } = await supabase
      .from('entries')
      .select(`
        userId,
        user:users!entries_userId_fkey(id, name, username, image, email)
      `)
      .in('userId', friendIds)
      .gte('date', `${dateParam}T00:00:00.000Z`)
      .lte('date', `${dateParam}T23:59:59.999Z`)

    if (error) throw error

    // Get unique friends who logged
    const friendsMap = new Map()
    entries?.forEach((entry: any) => {
      if (entry.user && !friendsMap.has(entry.user.id)) {
        friendsMap.set(entry.user.id, {
          id: entry.user.id,
          name: entry.user.name || entry.user.username || entry.user.email.split('@')[0],
          username: entry.user.username,
          image: entry.user.image,
        })
      }
    })

    return NextResponse.json({ friends: Array.from(friendsMap.values()) })
  } catch (error: any) {
    console.error('[friends/today] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch friends who logged today', message: error?.message },
      { status: 500 }
    )
  }
}

