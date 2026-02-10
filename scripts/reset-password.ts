import { getScriptSupabase } from './supabase-client'
import bcrypt from 'bcryptjs'

const supabase = getScriptSupabase()

async function resetPassword() {
  const email = process.argv[2]
  const newPassword = process.argv[3] || 'password123'

  if (!email) {
    console.log('Usage: npx tsx scripts/reset-password.ts <email> [newPassword]')
    console.log('\nExample:')
    console.log('  npx tsx scripts/reset-password.ts dimotesi44@gmail.com mynewpassword')
    process.exit(1)
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (error) throw error

    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword, updatedAt: new Date().toISOString() })
      .eq('email', email)

    if (updateError) throw updateError

    console.log(`✅ Password reset for ${email}`)
    console.log(`   New password: ${newPassword}`)
  } catch (error: any) {
    console.error('❌ Error resetting password:', error.message)
    process.exit(1)
  }
}

resetPassword()
