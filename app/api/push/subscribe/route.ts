import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

// POST - Subscribe to push notifications
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
    const { subscription } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Check if this endpoint already exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single()

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updatedAt: new Date().toISOString()
        })
        .eq('endpoint', subscription.endpoint)

      if (error) {
        console.error('[push/subscribe] Update error:', error)
        throw error
      }

      return NextResponse.json({ message: 'Subscription updated' })
    }

    // Create new subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        id: crypto.randomUUID(),
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

    if (error) {
      console.error('[push/subscribe] Insert error:', error)
      throw error
    }

    return NextResponse.json({ message: 'Subscribed successfully' })
  } catch (error: any) {
    console.error('Error subscribing to push:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to subscribe', message: error?.message },
      { status: 500 }
    )
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: Request) {
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
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('userId', userId)

    if (error) {
      console.error('[push/subscribe] Delete error:', error)
      throw error
    }

    return NextResponse.json({ message: 'Unsubscribed successfully' })
  } catch (error: any) {
    console.error('Error unsubscribing from push:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe', message: error?.message },
      { status: 500 }
    )
  }
}






