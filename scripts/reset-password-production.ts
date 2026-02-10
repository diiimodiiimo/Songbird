import { getScriptSupabase } from './supabase-client'
import bcrypt from 'bcryptjs'

// This script uses NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local
const supabase = getScriptSupabase()

async function resetPassword() {
  const email = process.argv[2]
  const newPassword = process.argv[3] || 'password123'

  if (!email) {
    console.log('Usage: npx tsx scripts/reset-password-production.ts <email> [newPassword]')
    console.log('\nExample:')
    console.log('  npx tsx scripts/reset-password-production.ts dimotesi44@gmail.com mynewpassword')
    process.exit(1)
  }

  try {
    console.log(`Connecting to Supabase...`)
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .maybeSingle()

    if (error) throw error

    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      process.exit(1)
    }

    console.log(`Found user: ${user.email} (${user.name || 'no name'})`)

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword, updatedAt: new Date().toISOString() })
      .eq('email', email)

    if (updateError) throw updateError

    console.log(`✅ Password reset for ${email}`)
    console.log(`   New password: ${newPassword}`)
    console.log(`\nYou can now sign in with:`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${newPassword}`)
  } catch (error: any) {
    console.error('❌ Error resetting password:', error.message)
    process.exit(1)
  }
}

resetPassword()
