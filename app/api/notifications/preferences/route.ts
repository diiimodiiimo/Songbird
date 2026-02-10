import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getUserIdFromClerk } from '@/lib/clerk-sync'

/**
 * Notification Preferences API
 * GET: Fetch user's notification preferences
 * PATCH: Update notification preferences
 */

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const supabase = getSupabase()

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        notificationsEnabled,
        pushNotificationsEnabled,
        reminderTime,
        reminderEnabled,
        notifyOnVibe,
        notifyOnComment,
        notifyOnMention,
        notifyOnFriendRequest,
        notifyOnFriendAccepted,
        notifyOnThisDay
      `)
      .eq('id', userId)
      .single()

    if (error) throw error

    // Return defaults if fields don't exist (for users created before migration)
    const preferences = {
      notificationsEnabled: user?.notificationsEnabled ?? true,
      pushNotificationsEnabled: user?.pushNotificationsEnabled ?? true,
      reminderTime: user?.reminderTime ?? 20,
      reminderEnabled: user?.reminderEnabled ?? true,
      notifyOnVibe: user?.notifyOnVibe ?? true,
      notifyOnComment: user?.notifyOnComment ?? true,
      notifyOnMention: user?.notifyOnMention ?? true,
      notifyOnFriendRequest: user?.notifyOnFriendRequest ?? true,
      notifyOnFriendAccepted: user?.notifyOnFriendAccepted ?? true,
      notifyOnThisDay: user?.notifyOnThisDay ?? true,
    }

    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error('[notifications/preferences] GET Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences', message: error?.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const {
      notificationsEnabled,
      pushNotificationsEnabled,
      reminderTime,
      reminderEnabled,
      notifyOnVibe,
      notifyOnComment,
      notifyOnMention,
      notifyOnFriendRequest,
      notifyOnFriendAccepted,
      notifyOnThisDay,
    } = body

    const supabase = getSupabase()

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    }

    if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled
    if (pushNotificationsEnabled !== undefined) updateData.pushNotificationsEnabled = pushNotificationsEnabled
    if (reminderTime !== undefined) {
      // Validate reminder time (0-23)
      const time = parseInt(String(reminderTime))
      if (isNaN(time) || time < 0 || time > 23) {
        return NextResponse.json(
          { error: 'reminderTime must be between 0 and 23' },
          { status: 400 }
        )
      }
      updateData.reminderTime = time
    }
    if (reminderEnabled !== undefined) updateData.reminderEnabled = reminderEnabled
    if (notifyOnVibe !== undefined) updateData.notifyOnVibe = notifyOnVibe
    if (notifyOnComment !== undefined) updateData.notifyOnComment = notifyOnComment
    if (notifyOnMention !== undefined) updateData.notifyOnMention = notifyOnMention
    if (notifyOnFriendRequest !== undefined) updateData.notifyOnFriendRequest = notifyOnFriendRequest
    if (notifyOnFriendAccepted !== undefined) updateData.notifyOnFriendAccepted = notifyOnFriendAccepted
    if (notifyOnThisDay !== undefined) updateData.notifyOnThisDay = notifyOnThisDay

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        notificationsEnabled,
        pushNotificationsEnabled,
        reminderTime,
        reminderEnabled,
        notifyOnVibe,
        notifyOnComment,
        notifyOnMention,
        notifyOnFriendRequest,
        notifyOnFriendAccepted,
        notifyOnThisDay
      `)
      .single()

    if (updateError) throw updateError

    const preferences = {
      notificationsEnabled: updatedUser?.notificationsEnabled ?? true,
      pushNotificationsEnabled: updatedUser?.pushNotificationsEnabled ?? true,
      reminderTime: updatedUser?.reminderTime ?? 20,
      reminderEnabled: updatedUser?.reminderEnabled ?? true,
      notifyOnVibe: updatedUser?.notifyOnVibe ?? true,
      notifyOnComment: updatedUser?.notifyOnComment ?? true,
      notifyOnMention: updatedUser?.notifyOnMention ?? true,
      notifyOnFriendRequest: updatedUser?.notifyOnFriendRequest ?? true,
      notifyOnFriendAccepted: updatedUser?.notifyOnFriendAccepted ?? true,
      notifyOnThisDay: updatedUser?.notifyOnThisDay ?? true,
    }

    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error('[notifications/preferences] PATCH Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to update preferences', message: error?.message },
      { status: 500 }
    )
  }
}



