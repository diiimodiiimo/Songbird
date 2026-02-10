import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    const { data: entry, error } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[waitlist/status] Error:', error)
      return NextResponse.json(
        { error: 'Failed to check waitlist status', message: error.message },
        { status: 500 }
      )
    }

    if (!entry) {
      return NextResponse.json({
        onWaitlist: false,
      })
    }

    // Get position
    const { count } = await supabase
      .from('waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .lte('joinedAt', entry.joinedAt)

    return NextResponse.json({
      onWaitlist: true,
      position: count || 0,
      entry: {
        email: entry.email,
        name: entry.name,
        source: entry.source,
        joinedAt: entry.joinedAt,
        invitedAt: entry.invitedAt,
        foundingFlockEligible: entry.foundingFlockEligible,
      },
    })
  } catch (error: any) {
    console.error('[waitlist/status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check waitlist status', message: error?.message },
      { status: 500 }
    )
  }
}
