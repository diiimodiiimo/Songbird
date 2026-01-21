import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { sendPushNotification, getNotificationContent, isWebPushConfigured } from '@/lib/push'

// POST - Send push notification to a user (internal API)
// This should be called when creating in-app notifications
export async function POST(request: Request) {
  try {
    // Check for internal API key or admin auth
    const authHeader = request.headers.get('x-api-key')
    const internalKey = process.env.INTERNAL_API_KEY

    // For security, this endpoint should only be called internally
    // In production, verify the request is coming from your server
    if (internalKey && authHeader !== internalKey) {
      // Allow in development or if no key is set
      if (process.env.NODE_ENV === 'production' && internalKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { userId, type, data } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!isWebPushConfigured()) {
      console.log('[push/send] Web push not configured, skipping')
      return NextResponse.json({ 
        message: 'Push notifications not configured',
        sent: 0 
      })
    }

    const supabase = getSupabase()

    // Get all push subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('userId', userId)

    if (error) {
      console.error('[push/send] Error fetching subscriptions:', error)
      throw error
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[push/send] No push subscriptions for user:', userId)
      return NextResponse.json({ 
        message: 'No subscriptions found',
        sent: 0 
      })
    }

    // Get notification content
    const payload = getNotificationContent(type, data)

    // Send to all user's subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const success = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        )

        // If subscription is invalid, remove it
        if (!success) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }

        return success
      })
    )

    const sentCount = results.filter(Boolean).length

    return NextResponse.json({ 
      message: `Sent ${sentCount} notification(s)`,
      sent: sentCount 
    })
  } catch (error: any) {
    console.error('Error sending push notification:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to send notification', message: error?.message },
      { status: 500 }
    )
  }
}



