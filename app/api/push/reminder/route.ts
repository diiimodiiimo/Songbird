import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { sendPushToUser } from '@/lib/sendPushToUser'

// POST - Send SOTD reminders to users who haven't logged today
// This should be called by a cron job (e.g., Vercel Cron at 6pm, 8pm)
// Respects user notification preferences
export async function POST(request: Request) {
  try {
    // Verify the request is authorized (cron secret or internal API key)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Check authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow in development
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = getSupabase()

    // Get current hour in UTC
    const now = new Date()
    const currentHourUTC = now.getUTCHours()

    // Get today's date range (in UTC)
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    // Get all users who have push subscriptions AND want reminders
    const { data: usersWithPush, error: usersError } = await supabase
      .from('push_subscriptions')
      .select('userId')
      .order('userId')

    if (usersError) {
      console.error('[push/reminder] Error fetching users:', usersError)
      throw usersError
    }

    // Get unique user IDs
    const userIds = Array.from(new Set((usersWithPush || []).map(u => u.userId)))

    if (userIds.length === 0) {
      return NextResponse.json({ 
        message: 'No users with push subscriptions',
        reminders_sent: 0 
      })
    }

    // Get user preferences for reminder time and enabled status
    const { data: userPreferences, error: prefsError } = await supabase
      .from('users')
      .select('id, reminderTime, reminderEnabled, notificationsEnabled, pushNotificationsEnabled')
      .in('id', userIds)

    if (prefsError) {
      console.error('[push/reminder] Error fetching preferences:', prefsError)
      throw prefsError
    }

    // Filter users who want reminders at this hour
    const usersWantingReminder = (userPreferences || []).filter(user => {
      // Check if notifications are enabled
      if (!user.notificationsEnabled || !user.pushNotificationsEnabled || !user.reminderEnabled) {
        return false
      }
      // Check if reminder time matches current hour (or within 1 hour window)
      const reminderHour = user.reminderTime ?? 20 // Default 8 PM
      return reminderHour === currentHourUTC || reminderHour === currentHourUTC - 1
    }).map(u => u.id)

    if (usersWantingReminder.length === 0) {
      return NextResponse.json({ 
        message: `No users want reminders at ${currentHourUTC}:00 UTC`,
        reminders_sent: 0,
        current_hour_utc: currentHourUTC
      })
    }

    // Get entries for today for these users
    const { data: todayEntries, error: entriesError } = await supabase
      .from('entries')
      .select('userId')
      .in('userId', usersWantingReminder)
      .gte('date', startOfDay.toISOString())
      .lte('date', endOfDay.toISOString())

    if (entriesError) {
      console.error('[push/reminder] Error fetching entries:', entriesError)
      throw entriesError
    }

    // Find users who HAVEN'T logged today
    const usersWithEntries = new Set((todayEntries || []).map(e => e.userId))
    const usersNeedingReminder = usersWantingReminder.filter(id => !usersWithEntries.has(id))

    if (usersNeedingReminder.length === 0) {
      return NextResponse.json({ 
        message: 'All users have logged their SOTD today!',
        reminders_sent: 0 
      })
    }

    console.log(`[push/reminder] Sending reminders to ${usersNeedingReminder.length} users at ${currentHourUTC}:00 UTC`)

    // Send reminders to all users who haven't logged
    const results = await Promise.all(
      usersNeedingReminder.map(async (userId) => {
        try {
          await sendPushToUser(userId, 'sotd_reminder')
          return { userId, success: true }
        } catch (error) {
          console.error(`[push/reminder] Failed for user ${userId}:`, error)
          return { userId, success: false }
        }
      })
    )

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({ 
      message: `Sent ${successCount} SOTD reminders`,
      reminders_sent: successCount,
      total_users_needing_reminder: usersNeedingReminder.length,
      current_hour_utc: currentHourUTC
    })
  } catch (error: any) {
    console.error('Error sending SOTD reminders:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to send reminders', message: error?.message },
      { status: 500 }
    )
  }
}

// GET - Check which users need reminders (for debugging)
// Protected: requires CRON_SECRET in production
export async function GET(request: Request) {
  try {
    // Verify authorization in production
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = getSupabase()

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    // Get all users with push subscriptions
    const { data: usersWithPush } = await supabase
      .from('push_subscriptions')
      .select('userId')

    const userIds = Array.from(new Set((usersWithPush || []).map(u => u.userId)))

    // Get today's entries
    const { data: todayEntries } = await supabase
      .from('entries')
      .select('userId')
      .in('userId', userIds)
      .gte('date', startOfDay.toISOString())
      .lte('date', endOfDay.toISOString())

    const usersWithEntries = new Set((todayEntries || []).map(e => e.userId))
    const usersNeedingReminder = userIds.filter(id => !usersWithEntries.has(id))

    return NextResponse.json({
      total_users_with_push: userIds.length,
      users_logged_today: usersWithEntries.size,
      users_needing_reminder: usersNeedingReminder.length,
      date: today.toISOString().split('T')[0]
    })
  } catch (error: any) {
    console.error('Error checking reminders:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to check reminders', message: error?.message },
      { status: 500 }
    )
  }
}

