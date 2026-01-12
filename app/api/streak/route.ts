import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prismaUserId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!prismaUserId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const supabase = getSupabase()

    const { data: entries, error } = await supabase
      .from('entries')
      .select('date')
      .eq('userId', prismaUserId)
      .order('date', { ascending: false })

    if (error) throw error

    if (!entries || entries.length === 0) {
      return NextResponse.json({ currentStreak: 0 })
    }

    // Calculate current streak
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const entryDates = new Set(
      entries.map((entry) => {
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

    return NextResponse.json({ currentStreak })
  } catch (error: any) {
    console.error('[streak] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to calculate streak', message: error?.message },
      { status: 500 }
    )
  }
}
