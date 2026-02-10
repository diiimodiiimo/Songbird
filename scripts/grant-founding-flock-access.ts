/**
 * Script to grant Founding Flock access to all existing users
 * 
 * This script updates all users in the database to have:
 * - isPremium = true
 * - isFoundingMember = true
 * - subscriptionTier = 'founding_flock_yearly'
 * - premiumSince = current date (if not already set)
 * 
 * Usage:
 *   # Preview what will be updated (dry-run)
 *   npx tsx scripts/grant-founding-flock-access.ts --dry-run
 * 
 *   # Apply the updates
 *   npx tsx scripts/grant-founding-flock-access.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const isDryRun = process.argv.includes('--dry-run')

async function grantFoundingFlockAccess() {
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
  } else {
    console.log('🚀 Granting Founding Flock access to all existing users...\n')
  }

  try {
    // Get all users
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, username, isPremium, isFoundingMember, premiumSince')

    if (fetchError) {
      throw fetchError
    }

    if (!allUsers || allUsers.length === 0) {
      console.log('⚠️  No users found in database\n')
      return
    }

    console.log(`📊 Found ${allUsers.length} total users\n`)

    // Filter users who need updating
    const usersToUpdate = allUsers.filter(
      user => !user.isPremium || !user.isFoundingMember
    )

    console.log(`📝 Found ${usersToUpdate.length} users needing update\n`)

    if (usersToUpdate.length === 0) {
      console.log('✅ All users already have Founding Flock access!\n')
      return
    }

    if (isDryRun) {
      console.log('📋 Users that would be updated:\n')
      usersToUpdate.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email}`)
        console.log(`     Name: ${user.name || user.username || 'N/A'}`)
        console.log(`     Current: isPremium=${user.isPremium}, isFoundingMember=${user.isFoundingMember}`)
        console.log(`     Would set: isPremium=true, isFoundingMember=true, subscriptionTier='founding_flock_yearly'`)
        console.log('')
      })
      console.log(`\n✨ Dry run complete. Run without --dry-run to apply changes.`)
      return
    }

    // Update users in batches
    const batchSize = 50
    let updated = 0
    let errors = 0

    for (let i = 0; i < usersToUpdate.length; i += batchSize) {
      const batch = usersToUpdate.slice(i, i + batchSize)
      
      for (const user of batch) {
        try {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              isPremium: true,
              isFoundingMember: true,
              subscriptionTier: 'founding_flock_yearly',
              premiumSince: user.premiumSince || new Date().toISOString(),
            })
            .eq('id', user.id)

          if (updateError) {
            console.error(`\n❌ Error updating ${user.email}:`, updateError.message)
            errors++
          } else {
            updated++
            if (updated % 10 === 0) {
              process.stdout.write(`\r✅ Updated ${updated}/${usersToUpdate.length} users...`)
            }
          }
        } catch (err: any) {
          console.error(`\n❌ Error updating ${user.email}:`, err.message)
          errors++
        }
      }
    }

    console.log(`\n\n🎉 Migration complete!`)
    console.log(`   ✅ Updated: ${updated} users`)
    if (errors > 0) {
      console.log(`   ⚠️  Errors: ${errors} users`)
    }
    console.log(`\nAll existing users now have Founding Flock access!`)

    // Verify the update
    const { count: premiumUsers, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('isPremium', true)
      .eq('isFoundingMember', true)

    if (!countError) {
      console.log(`\n📊 Verification: ${premiumUsers} users now have Founding Flock status`)
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the migration
grantFoundingFlockAccess()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
