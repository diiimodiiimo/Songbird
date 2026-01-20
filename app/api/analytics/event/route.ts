import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { trackEvent } from '@/lib/analytics'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

// Analytics event logging - stores to database
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    const body = await request.json()
    const { event, properties = {} } = body

    if (!event) {
      return NextResponse.json({ error: 'Event name required' }, { status: 400 })
    }

    // Get internal user ID if signed in
    let internalUserId: string | null = null
    if (clerkId) {
      try {
        internalUserId = await getPrismaUserIdFromClerk(clerkId)
      } catch {
        // Continue without user ID if lookup fails
      }
    }

    // Log to console for debugging
    console.log('[Analytics]', {
      event,
      userId: internalUserId || 'anonymous',
      clerkId: clerkId || 'anonymous',
      properties,
      timestamp: new Date().toISOString(),
    })

    // Store in database
    await trackEvent({
      userId: internalUserId,
      event,
      properties: {
        ...properties,
        clerkId: clerkId || undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging analytics event:', error)
    // Don't fail the request for analytics errors
    return NextResponse.json({ success: true })
  }
}

