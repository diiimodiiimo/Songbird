import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Founding Flock checkout - disabled until Stripe is fully configured
export async function POST() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Stripe not configured yet
    return NextResponse.json(
      { error: 'Premium purchases are coming soon! All users currently have Founding Flock access.' },
      { status: 503 }
    )
  } catch (error: unknown) {
    console.error('[checkout/founding-flock] Error:', error)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Founding Flock checkout - coming soon',
    allUsersHaveAccess: true 
  })
}
