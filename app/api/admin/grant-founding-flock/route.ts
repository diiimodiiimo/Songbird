/**
 * API endpoint to grant Founding Flock access to all existing users
 * 
 * This is a one-time admin endpoint that can be called to update all users.
 * It should be protected or removed after use.
 * 
 * POST /api/admin/grant-founding-flock
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Optional: Add admin check here
    // const { userId } = await auth()
    // if (!userId || userId !== 'your-admin-clerk-id') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const supabase = getSupabase()

    // Get all users
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('id, email, isPremium, isFoundingMember, premiumSince')

    if (selectError) {
      throw selectError
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        message: 'No users found',
        updated: 0 
      })
    }

    // Update all users to have Founding Flock access
    const updates = users.map(user => ({
      id: user.id,
      isPremium: true,
      isFoundingMember: true,
      subscriptionTier: 'founding_flock_yearly',
      premiumSince: user.premiumSince || new Date().toISOString(),
    }))

    let updated = 0
    let errors = 0

    for (const update of updates) {
      const { error } = await supabase
        .from('users')
        .update({
          isPremium: update.isPremium,
          isFoundingMember: update.isFoundingMember,
          subscriptionTier: update.subscriptionTier,
          premiumSince: update.premiumSince,
        })
        .eq('id', update.id)

      if (error) {
        console.error(`Error updating user ${update.id}:`, error)
        errors++
      } else {
        updated++
      }
    }

    return NextResponse.json({
      message: 'Founding Flock access granted to all existing users',
      totalUsers: users.length,
      updated,
      errors,
    })

  } catch (error: any) {
    console.error('Error granting Founding Flock access:', error)
    return NextResponse.json(
      { error: 'Failed to grant Founding Flock access', message: error.message },
      { status: 500 }
    )
  }
}


