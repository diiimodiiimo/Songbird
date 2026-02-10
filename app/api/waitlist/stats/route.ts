import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { FOUNDING_FLOCK_LIMIT } from '@/lib/stripe'

/**
 * GET /api/waitlist/stats
 * Public waitlist statistics
 */
export async function GET() {
  try {
    const supabase = getSupabase()

    // Count total waitlist entries
    const { count: totalCount, error: countError } = await supabase
      .from('waitlist_entries')
      .select('id', { count: 'exact', head: true })

    if (countError) {
      console.error('[waitlist/stats] Error:', countError)
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      )
    }

    // Count founding members (users who have purchased)
    const { count: foundingCount, error: foundingError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('isFoundingMember', true)

    if (foundingError) {
      console.error('[waitlist/stats] Founding count error:', foundingError)
    }

    const total = totalCount || 0
    const foundingMembers = foundingCount || 0
    const remaining = Math.max(0, FOUNDING_FLOCK_LIMIT - foundingMembers)
    const available = remaining > 0

    return NextResponse.json({
      waitlistTotal: total,
      foundingMembers,
      foundingSlotsRemaining: remaining,
      foundingSlotsAvailable: available,
      foundingSlotsTotal: FOUNDING_FLOCK_LIMIT,
    })
  } catch (error: unknown) {
    console.error('[waitlist/stats] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


