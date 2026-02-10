/**
 * Grant Founding Flock membership to a user by email
 * 
 * Usage:
 *   npx tsx scripts/grant-founding-member.ts friend@email.com
 */

import { getScriptSupabase } from './supabase-client'

const supabase = getScriptSupabase()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error('❌ Usage: npx tsx scripts/grant-founding-member.ts <email>')
    console.error('   Example: npx tsx scripts/grant-founding-member.ts friend@email.com')
    process.exit(1)
  }

  console.log(`🔍 Looking for user with email: ${email}`)

  // Find user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, username, isPremium, isFoundingMember')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (error) throw error

  if (!user) {
    console.error(`❌ User not found with email: ${email}`)
    console.error('   Make sure the user has signed up first.')
    process.exit(1)
  }

  if (user.isPremium && user.isFoundingMember) {
    console.log(`✅ User is already a Founding Flock member!`)
    console.log(`   Name: ${user.name || user.username || 'N/A'}`)
    console.log(`   Email: ${user.email}`)
    process.exit(0)
  }

  // Grant founding membership
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({
      isPremium: true,
      isFoundingMember: true,
      premiumSince: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('name, username, email, premiumSince')
    .single()

  if (updateError) throw updateError

  console.log(`🎉 Successfully granted Founding Flock membership!`)
  console.log(`   Name: ${updatedUser.name || updatedUser.username || 'N/A'}`)
  console.log(`   Email: ${updatedUser.email}`)
  console.log(`   Premium Since: ${updatedUser.premiumSince}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
