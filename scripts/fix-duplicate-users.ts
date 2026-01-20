/**
 * Fix duplicate user records created by Clerk sync
 * 
 * This script:
 * 1. Finds all users with the same email (duplicates)
 * 2. Identifies the "primary" record (the one with username/profile data)
 * 3. Updates entries, friend requests, etc. to point to the primary record
 * 4. Deletes the duplicate empty record
 * 5. Ensures the primary record has the correct clerkId
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
  console.log('Make sure you have these in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDuplicateUsers() {
  console.log('Finding duplicate users by email...\n')

  // Find all emails that have multiple user records
  const { data: allUsers, error } = await supabase
    .from('users')
    .select('id, email, username, image, clerkId, createdAt, name')
    .order('createdAt', { ascending: true })

  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  // Group users by email
  const usersByEmail = new Map<string, typeof allUsers>()
  for (const user of allUsers || []) {
    if (!user.email) continue
    const existing = usersByEmail.get(user.email) || []
    existing.push(user)
    usersByEmail.set(user.email, existing)
  }

  // Find emails with duplicates
  const duplicates = Array.from(usersByEmail.entries()).filter(([_, users]) => users.length > 1)

  if (duplicates.length === 0) {
    console.log('No duplicate users found!')
    return
  }

  console.log(`Found ${duplicates.length} emails with duplicate records:\n`)

  for (const [email, users] of duplicates) {
    console.log(`\n========================================`)
    console.log(`Email: ${email}`)
    console.log(`Number of records: ${users.length}`)
    console.log('----------------------------------------')

    for (const user of users) {
      console.log(`  ID: ${user.id}`)
      console.log(`  Username: ${user.username || '(none)'}`)
      console.log(`  Has Image: ${user.image ? 'YES' : 'NO'}`)
      console.log(`  ClerkId: ${user.clerkId || '(none)'}`)
      console.log(`  Created: ${user.createdAt}`)
      console.log('  ---')
    }

    // Identify primary user (the one with a username, or the oldest one with data)
    const primary = users.find(u => u.username) || users.find(u => u.image) || users[0]
    const duplicatesToMerge = users.filter(u => u.id !== primary.id)

    console.log(`\nPrimary record: ${primary.id} (username: ${primary.username || 'none'})`)
    console.log(`Records to merge into primary: ${duplicatesToMerge.map(u => u.id).join(', ')}`)

    // Find the clerkId to use (from any record that has it)
    const clerkIdToUse = users.find(u => u.clerkId)?.clerkId

    if (!clerkIdToUse) {
      console.log('WARNING: No clerkId found on any record - user may need to log in again')
    }

    // Ask for confirmation
    console.log('\nWould merge:')
    for (const dup of duplicatesToMerge) {
      console.log(`  - Transfer all data from ${dup.id} to ${primary.id}`)
      console.log(`  - Delete record ${dup.id}`)
    }
    if (clerkIdToUse) {
      console.log(`  - Set clerkId on ${primary.id} to ${clerkIdToUse}`)
    }
  }

  // Prompt for actual fix
  console.log('\n========================================')
  console.log('To actually fix these duplicates, run:')
  console.log('  npx tsx scripts/fix-duplicate-users.ts --fix')
  console.log('========================================\n')

  if (process.argv.includes('--fix')) {
    console.log('\n🔧 FIXING DUPLICATES...\n')

    for (const [email, users] of duplicates) {
      const primary = users.find(u => u.username) || users.find(u => u.image) || users[0]
      const duplicatesToMerge = users.filter(u => u.id !== primary.id)
      const clerkIdToUse = users.find(u => u.clerkId)?.clerkId

      for (const dup of duplicatesToMerge) {
        console.log(`\nMerging ${dup.id} into ${primary.id}...`)

        // 1. Update entries to point to primary user
        const { error: entriesError, count: entriesCount } = await supabase
          .from('entries')
          .update({ userId: primary.id })
          .eq('userId', dup.id)

        if (entriesError) {
          console.error('  Error updating entries:', entriesError)
        } else {
          console.log(`  Updated entries: ${entriesCount || 0}`)
        }

        // 2. Update friend requests (fromUserId)
        const { error: frFromError, count: frFromCount } = await supabase
          .from('friend_requests')
          .update({ fromUserId: primary.id })
          .eq('fromUserId', dup.id)

        if (frFromError) {
          console.error('  Error updating friend_requests (from):', frFromError)
        } else {
          console.log(`  Updated friend_requests (from): ${frFromCount || 0}`)
        }

        // 3. Update friend requests (toUserId)
        const { error: frToError, count: frToCount } = await supabase
          .from('friend_requests')
          .update({ toUserId: primary.id })
          .eq('toUserId', dup.id)

        if (frToError) {
          console.error('  Error updating friend_requests (to):', frToError)
        } else {
          console.log(`  Updated friend_requests (to): ${frToCount || 0}`)
        }

        // 4. Update notifications (userId)
        const { error: notifUserError, count: notifUserCount } = await supabase
          .from('notifications')
          .update({ userId: primary.id })
          .eq('userId', dup.id)

        if (notifUserError) {
          console.error('  Error updating notifications (userId):', notifUserError)
        } else {
          console.log(`  Updated notifications (userId): ${notifUserCount || 0}`)
        }

        // 5. Update notifications (fromUserId)
        const { error: notifFromError, count: notifFromCount } = await supabase
          .from('notifications')
          .update({ fromUserId: primary.id })
          .eq('fromUserId', dup.id)

        if (notifFromError) {
          console.error('  Error updating notifications (fromUserId):', notifFromError)
        } else {
          console.log(`  Updated notifications (fromUserId): ${notifFromCount || 0}`)
        }

        // 6. Update person_references
        const { error: personError, count: personCount } = await supabase
          .from('person_references')
          .update({ userId: primary.id })
          .eq('userId', dup.id)

        if (personError) {
          console.error('  Error updating person_references:', personError)
        } else {
          console.log(`  Updated person_references: ${personCount || 0}`)
        }

        // 7. Update push_subscriptions
        const { error: pushError, count: pushCount } = await supabase
          .from('push_subscriptions')
          .update({ userId: primary.id })
          .eq('userId', dup.id)

        if (pushError) {
          console.error('  Error updating push_subscriptions:', pushError)
        } else {
          console.log(`  Updated push_subscriptions: ${pushCount || 0}`)
        }

        // 8. Update analytics_events
        const { error: analyticsError, count: analyticsCount } = await supabase
          .from('analytics_events')
          .update({ userId: primary.id })
          .eq('userId', dup.id)

        if (analyticsError && !analyticsError.message.includes('does not exist')) {
          console.error('  Error updating analytics_events:', analyticsError)
        } else {
          console.log(`  Updated analytics_events: ${analyticsCount || 0}`)
        }

        // 9. Delete the duplicate user record
        console.log(`  Deleting duplicate record ${dup.id}...`)
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', dup.id)

        if (deleteError) {
          console.error('  Error deleting duplicate:', deleteError)
        } else {
          console.log('  ✓ Deleted duplicate')
        }
      }

      // Update primary with clerkId if needed
      if (clerkIdToUse && primary.clerkId !== clerkIdToUse) {
        console.log(`\nUpdating primary ${primary.id} with clerkId ${clerkIdToUse}...`)
        const { error: updateError } = await supabase
          .from('users')
          .update({ clerkId: clerkIdToUse })
          .eq('id', primary.id)

        if (updateError) {
          console.error('Error updating clerkId:', updateError)
        } else {
          console.log('✓ Updated clerkId')
        }
      }

      console.log(`\n✅ Fixed duplicates for ${email}`)
    }

    console.log('\n========================================')
    console.log('DONE! All duplicates have been merged.')
    console.log('The user should now see their original profile.')
    console.log('========================================\n')
  }
}

fixDuplicateUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })

