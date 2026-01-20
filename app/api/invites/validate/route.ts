import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ valid: false })
    }

    const supabase = getSupabase()

    // First check if it's a user's personal invite code
    const { data: userWithCode } = await supabase
      .from('users')
      .select('id, name, username')
      .eq('inviteCode', code)
      .single()

    if (userWithCode) {
      return NextResponse.json({
        valid: true,
        senderName: userWithCode.name || userWithCode.username,
        senderUsername: userWithCode.username,
        type: 'personal',
      })
    }

    // Then check invite records
    const { data: invite } = await supabase
      .from('invites')
      .select('senderId, status, createdAt')
      .eq('code', code)
      .single()

    if (!invite) {
      return NextResponse.json({ valid: false })
    }

    // Check if expired (invites are valid for 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    if (new Date(invite.createdAt) < thirtyDaysAgo) {
      return NextResponse.json({ valid: false, reason: 'expired' })
    }

    // Check if already used
    if (invite.status === 'accepted') {
      return NextResponse.json({ valid: false, reason: 'already_used' })
    }

    // Get sender info
    const { data: sender } = await supabase
      .from('users')
      .select('id, name, username')
      .eq('id', invite.senderId)
      .single()

    return NextResponse.json({
      valid: true,
      senderName: sender?.name || sender?.username,
      senderUsername: sender?.username,
      type: 'invite',
    })
  } catch (error) {
    console.error('Error validating invite:', error)
    return NextResponse.json({ valid: false })
  }
}
