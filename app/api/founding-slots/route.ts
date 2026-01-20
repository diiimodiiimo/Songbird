import { NextResponse } from 'next/server'
import { getFoundingMemberCount } from '@/lib/premium'
import { FOUNDING_FLOCK_LIMIT } from '@/lib/stripe'

export async function GET() {
  try {
    const claimed = await getFoundingMemberCount()
    const remaining = FOUNDING_FLOCK_LIMIT - claimed

    return NextResponse.json({
      total: FOUNDING_FLOCK_LIMIT,
      claimed,
      remaining,
      available: remaining > 0,
    })
  } catch (error: unknown) {
    console.error('[founding-slots] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to get founding slots'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

