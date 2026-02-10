import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    // Check if waitlist mode is enabled
    const waitlistEnabled = process.env.WAITLIST_MODE_ENABLED === 'true'

    // If invite code provided, check if it's valid
    if (code) {
      const supabase = getSupabase()

      // Check if it's a user's personal invite code
      const { data: userWithCode } = await supabase
        .from('users')
        .select('id, name, username, inviteCode')
        .eq('inviteCode', code)
        .single()

      if (userWithCode) {
        return NextResponse.json({
          canSignUp: true,
          bypassWaitlist: true,
          inviteType: 'personal',
          senderName: userWithCode.name || userWithCode.username,
          senderUsername: userWithCode.username,
        })
      }

      // Check invite records
      const { data: invite } = await supabase
        .from('invites')
        .select('senderId, status, createdAt')
        .eq('code', code)
        .single()

      if (invite) {
        // Check if expired (invites are valid for 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        if (new Date(invite.createdAt) >= thirtyDaysAgo && invite.status !== 'accepted') {
          // Valid invite code - bypass waitlist
          return NextResponse.json({
            canSignUp: true,
            bypassWaitlist: true,
            inviteType: 'invite',
          })
        }
      }
    }

    // If waitlist is disabled, allow signup
    if (!waitlistEnabled) {
      return NextResponse.json({
        canSignUp: true,
        bypassWaitlist: false,
      })
    }

    // If waitlist is enabled and no valid invite code, user must join waitlist
    return NextResponse.json({
      canSignUp: false,
      bypassWaitlist: false,
      reason: 'waitlist_required',
      message: 'Please join the waitlist to get access',
    })
  } catch (error: any) {
    console.error('[waitlist/check] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check signup eligibility', message: error?.message },
      { status: 500 }
    )
  }
}

