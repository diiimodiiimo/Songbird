import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const { userId: clerkId } = await auth()
  
  if (!clerkId) {
    redirect('/home')
  }

  // Check if user has completed onboarding
  try {
    const supabase = getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('onboardingCompletedAt, username')
      .eq('clerkId', clerkId)
      .single()

    // If user hasn't completed onboarding AND doesn't have a username, redirect to welcome
    // Existing users with usernames are considered to have completed onboarding
    if (user && user.onboardingCompletedAt === null && !user.username) {
      redirect('/welcome')
    }
  } catch (error) {
    // If column doesn't exist or other error, continue to dashboard
    console.log('[page] Onboarding check skipped:', error)
  }

  return <Dashboard />
}
