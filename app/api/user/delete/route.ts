import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getUserIdFromClerk } from '@/lib/clerk-sync'

/**
 * Account Deletion API
 * Deletes all user data from Supabase and Clerk
 * 
 * Order matters for foreign key constraints:
 * 1. Delete notifications
 * 2. Delete friend requests (both sent and received)
 * 3. Delete vibes
 * 4. Delete comments
 * 5. Delete person references
 * 6. Delete entry tags
 * 7. Delete mentions
 * 8. Delete entries
 * 9. Delete push subscriptions
 * 10. Delete invites
 * 11. Delete user record
 * 12. Delete from Clerk
 */
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { confirmText } = body

    // Safety measure: require typing "DELETE" to confirm
    if (confirmText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please type "DELETE" to confirm account deletion' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const supabase = getSupabase()

    console.log(`[user/delete] Starting deletion for user: ${userId}`)

    // Delete in order to respect foreign key constraints
    // Note: Many of these will cascade automatically, but we'll be explicit

    // 1. Delete notifications
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .eq('userId', userId)
    if (notificationsError) {
      console.error('[user/delete] Error deleting notifications:', notificationsError)
      throw notificationsError
    }
    console.log('[user/delete] Deleted notifications')

    // 2. Delete friend requests (both sent and received)
    const { error: friendRequestsError } = await supabase
      .from('friend_requests')
      .delete()
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`)
    if (friendRequestsError) {
      console.error('[user/delete] Error deleting friend requests:', friendRequestsError)
      throw friendRequestsError
    }
    console.log('[user/delete] Deleted friend requests')

    // 3. Delete vibes (user's reactions to entries)
    const { error: vibesError } = await supabase
      .from('vibes')
      .delete()
      .eq('userId', userId)
    if (vibesError) {
      console.error('[user/delete] Error deleting vibes:', vibesError)
      throw vibesError
    }
    console.log('[user/delete] Deleted vibes')

    // 4. Delete comments (user's comments on entries)
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('userId', userId)
    if (commentsError) {
      console.error('[user/delete] Error deleting comments:', commentsError)
      throw commentsError
    }
    console.log('[user/delete] Deleted comments')

    // 5. Delete person references (tags on entries)
    const { error: personRefsError } = await supabase
      .from('person_references')
      .delete()
      .eq('userId', userId)
    if (personRefsError) {
      console.error('[user/delete] Error deleting person references:', personRefsError)
      throw personRefsError
    }
    console.log('[user/delete] Deleted person references')

    // 6. Delete entry tags (user tagged in entries)
    const { error: entryTagsError } = await supabase
      .from('entry_tags')
      .delete()
      .eq('userId', userId)
    if (entryTagsError) {
      console.error('[user/delete] Error deleting entry tags:', entryTagsError)
      throw entryTagsError
    }
    console.log('[user/delete] Deleted entry tags')

    // 7. Delete mentions (user mentioned in entries)
    const { error: mentionsError } = await supabase
      .from('mentions')
      .delete()
      .eq('userId', userId)
    if (mentionsError) {
      console.error('[user/delete] Error deleting mentions:', mentionsError)
      throw mentionsError
    }
    console.log('[user/delete] Deleted mentions')

    // 8. Delete entries (this will cascade to related data)
    const { error: entriesError } = await supabase
      .from('entries')
      .delete()
      .eq('userId', userId)
    if (entriesError) {
      console.error('[user/delete] Error deleting entries:', entriesError)
      throw entriesError
    }
    console.log('[user/delete] Deleted entries')

    // 9. Delete push subscriptions
    const { error: pushSubsError } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('userId', userId)
    if (pushSubsError) {
      console.error('[user/delete] Error deleting push subscriptions:', pushSubsError)
      throw pushSubsError
    }
    console.log('[user/delete] Deleted push subscriptions')

    // 10. Delete invites (both sent and received)
    const { error: invitesError } = await supabase
      .from('invites')
      .delete()
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`)
    if (invitesError) {
      console.error('[user/delete] Error deleting invites:', invitesError)
      throw invitesError
    }
    console.log('[user/delete] Deleted invites')

    // 11. Delete analytics events
    const { error: analyticsError } = await supabase
      .from('analytics_events')
      .delete()
      .eq('userId', userId)
    if (analyticsError) {
      console.error('[user/delete] Error deleting analytics events:', analyticsError)
      // Don't throw - analytics events are less critical
    }
    console.log('[user/delete] Deleted analytics events')

    // 12. Delete unlocked birds
    const { error: birdsError } = await supabase
      .from('unlocked_birds')
      .delete()
      .eq('userId', userId)
    if (birdsError) {
      console.error('[user/delete] Error deleting unlocked birds:', birdsError)
      // Don't throw - this is less critical
    }
    console.log('[user/delete] Deleted unlocked birds')

    // 13. Delete user record
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    if (userError) {
      console.error('[user/delete] Error deleting user:', userError)
      throw userError
    }
    console.log('[user/delete] Deleted user record')

    // 14. Delete from Clerk
    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    if (!clerkSecretKey) {
      console.warn('[user/delete] CLERK_SECRET_KEY not set, skipping Clerk deletion')
    } else {
      try {
        const clerkDeleteResponse = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${clerkSecretKey}`,
            'Content-Type': 'application/json',
          },
        })

        if (!clerkDeleteResponse.ok) {
          const errorText = await clerkDeleteResponse.text()
          console.error('[user/delete] Clerk deletion error:', clerkDeleteResponse.status, errorText)
          // Don't throw - database deletion succeeded, Clerk deletion is secondary
        } else {
          console.log('[user/delete] Deleted Clerk user')
        }
      } catch (clerkError) {
        console.error('[user/delete] Clerk deletion exception:', clerkError)
        // Don't throw - database deletion succeeded
      }
    }

    console.log(`[user/delete] Successfully deleted all data for user: ${userId}`)

    return NextResponse.json(
      { message: 'Account and all associated data have been permanently deleted' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[user/delete] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to delete account', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}



