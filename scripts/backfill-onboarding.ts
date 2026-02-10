/**
 * Backfill script for existing users
 * Sets onboardingCompletedAt to createdAt for all existing users
 * so they don't see the onboarding flow
 * 
 * Run with: npx tsx scripts/backfill-onboarding.ts
 */

import { getScriptSupabase } from './supabase-client'

const supabase = getScriptSupabase()

async function main() {
  console.log('Starting onboarding backfill...')

  // Find all users without onboardingCompletedAt
  const { data: usersToUpdate, error } = await supabase
    .from('users')
    .select('id, email, createdAt')
    .is('onboardingCompletedAt', null)

  if (error) throw error
  console.log(`Found ${(usersToUpdate || []).length} users to backfill`)

  // Update each user
  for (const user of usersToUpdate || []) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ onboardingCompletedAt: user.createdAt })
      .eq('id', user.id)

    if (updateError) {
      console.error(`  ✗ Error updating ${user.email}:`, updateError.message)
    } else {
      console.log(`  ✓ Updated ${user.email}`)
    }
  }

  console.log('Backfill complete!')
}

main().catch(console.error)
