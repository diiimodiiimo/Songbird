import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

export async function POST() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID
    const userId = await getPrismaUserIdFromClerk(clerkId)

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = getSupabase()

    // Get current user data
    const { data: userData } = await supabase
      .from('users')
      .select('inviteCode')
      .eq('id', userId)
      .single()

    // Mark onboarding as complete
    await supabase
      .from('users')
      .update({
        onboardingCompletedAt: new Date().toISOString(),
      })
      .eq('id', userId)

    // Generate invite code if not exists
    if (!userData?.inviteCode) {
      const inviteCode = generateInviteCode()
      await supabase
        .from('users')
        .update({ inviteCode })
        .eq('id', userId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
