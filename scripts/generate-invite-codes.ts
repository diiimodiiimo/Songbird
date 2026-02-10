/**
 * Generate invite codes for all users who don't have one
 * 
 * Run with: npx tsx scripts/generate-invite-codes.ts
 */

import { getScriptSupabase } from './supabase-client'

const supabase = getScriptSupabase()

function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function main() {
  console.log('Generating invite codes...')

  // Find all users without invite codes
  const { data: usersWithoutCodes, error } = await supabase
    .from('users')
    .select('id, email')
    .is('inviteCode', null)

  if (error) throw error
  console.log(`Found ${(usersWithoutCodes || []).length} users without invite codes`)

  // Get existing codes to avoid duplicates
  const { data: usersWithCodes } = await supabase
    .from('users')
    .select('inviteCode')
    .not('inviteCode', 'is', null)

  const existingCodes = new Set((usersWithCodes || []).map(u => u.inviteCode))

  for (const user of usersWithoutCodes || []) {
    let code: string
    do {
      code = generateInviteCode()
    } while (existingCodes.has(code))

    existingCodes.add(code)

    const { error: updateError } = await supabase
      .from('users')
      .update({ inviteCode: code })
      .eq('id', user.id)

    if (updateError) {
      console.error(`  ✗ Error updating ${user.email}:`, updateError.message)
    } else {
      console.log(`  ✓ ${user.email}: ${code}`)
    }
  }

  console.log('Done!')
}

main().catch(console.error)
