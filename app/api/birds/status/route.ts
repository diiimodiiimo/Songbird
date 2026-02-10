import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getBirdUnlockStatuses, BIRD_UNLOCK_REQUIREMENTS } from '@/lib/birds'

/**
 * Get Supabase user ID directly from Clerk email
 * Bypasses Clerk ID mapping - goes straight to Supabase
 */
async function getUserIdFromClerkEmail(): Promise<string | null> {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
      console.error('[birds/status] No Clerk email found')
      return null
    }

    const email = clerkUser.emailAddresses[0].emailAddress
    const supabase = getSupabase()

    // Query Supabase directly by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('[birds/status] Supabase query error:', error)
      return null
    }

    if (!user) {
      console.error('[birds/status] User not found in Supabase for email:', email)
      return null
    }

    console.log('[birds/status] Found Supabase user:', user.id, 'for email:', email)
    return user.id
  } catch (error: any) {
    console.error('[birds/status] Error getting Supabase user:', error)
    return null
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[birds/status] Clerk ID:', clerkId)
    
    // Get Supabase user ID directly from email (bypasses Clerk ID mapping)
    const userId = await getUserIdFromClerkEmail()
    console.log('[birds/status] Supabase user ID:', userId)
    
    if (!userId) {
      console.error('[birds/status] Failed to get Supabase user ID - returning default birds only')
      // Return at least default birds unlocked
      const defaultBirds = BIRD_UNLOCK_REQUIREMENTS
        .filter(bird => bird.unlockType === 'default')
        .map(bird => ({
          birdId: bird.birdId,
          name: bird.name,
          shortName: bird.shortName,
          isUnlocked: true,
          unlockMethod: 'default' as const,
          canPurchase: false,
          unlockCondition: bird.unlockCondition,
        }))
      
      return NextResponse.json({ 
        birds: defaultBirds,
        unlockedCount: defaultBirds.length,
        totalCount: BIRD_UNLOCK_REQUIREMENTS.length,
        error: 'User not found - showing default birds only',
      })
    }

    const statuses = await getBirdUnlockStatuses(userId)
    console.log('[birds/status] Returning statuses:', {
      total: statuses.length,
      unlocked: statuses.filter(s => s.isUnlocked).length,
      defaultBirds: statuses.filter(s => s.unlockMethod === 'default').length,
    })
    
    return NextResponse.json({ 
      birds: statuses,
      unlockedCount: statuses.filter(s => s.isUnlocked).length,
      totalCount: statuses.length,
    })
  } catch (error: any) {
    console.error('[birds/status] Error:', error?.message || error)
    console.error('[birds/status] Stack:', error?.stack)
    
    // Even on error, return default birds
    try {
      const defaultBirds = BIRD_UNLOCK_REQUIREMENTS
        .filter(bird => bird.unlockType === 'default')
        .map(bird => ({
          birdId: bird.birdId,
          name: bird.name,
          shortName: bird.shortName,
          isUnlocked: true,
          unlockMethod: 'default' as const,
          canPurchase: false,
          unlockCondition: bird.unlockCondition,
        }))
      
      return NextResponse.json({ 
        birds: defaultBirds,
        unlockedCount: defaultBirds.length,
        totalCount: BIRD_UNLOCK_REQUIREMENTS.length,
        error: 'Error loading birds - showing defaults only',
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to get bird statuses', message: error?.message },
        { status: 500 }
      )
    }
  }
}





