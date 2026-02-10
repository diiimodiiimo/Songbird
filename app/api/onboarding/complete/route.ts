import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { currentUser } from '@clerk/nextjs/server'

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

    // Get current user data and email
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress

    const { data: userData } = await supabase
      .from('users')
      .select('inviteCode, email')
      .eq('id', userId)
      .single()

    // Check if user is on waitlist and eligible for Founding Flock
    let shouldGrantPremium = false
    let stripeCustomerId: string | null = null

    if (email) {
      const { data: waitlistEntry } = await supabase
        .from('waitlist_entries')
        .select('foundingFlockEligible, stripeCustomerId')
        .eq('email', email)
        .single()

      if (waitlistEntry?.foundingFlockEligible) {
        shouldGrantPremium = true
        stripeCustomerId = waitlistEntry.stripeCustomerId || null
      }
    }

    // Mark onboarding as complete
    const updateData: any = {
      onboardingCompletedAt: new Date().toISOString(),
    }

    // Grant premium if Founding Flock eligible
    if (shouldGrantPremium) {
      updateData.isPremium = true
      updateData.isFoundingMember = true
      updateData.premiumSince = new Date().toISOString()
      if (stripeCustomerId) {
        updateData.stripeCustomerId = stripeCustomerId
      }
    }

    await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)

    // Generate invite code if not exists
    if (!userData?.inviteCode) {
      const inviteCode = generateInviteCode()
      await supabase
        .from('users')
        .update({ inviteCode })
        .eq('id', userId)
    }

    return NextResponse.json({ 
      success: true,
      isFoundingMember: shouldGrantPremium,
    })
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
