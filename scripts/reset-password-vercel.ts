import { getScriptSupabase } from './supabase-client'
import bcrypt from 'bcryptjs'

// Uses Supabase connection from .env.local
const supabase = getScriptSupabase()

async function resetPasswords() {
  try {
    console.log('🔗 Connecting to Supabase...\n')

    // Reset password for first user
    const email1 = 'dimotesi44@gmail.com'
    const password1 = 'password123'
    
    console.log(`📧 Resetting password for ${email1}...`)
    const { data: user1 } = await supabase
      .from('users')
      .select('id')
      .eq('email', email1)
      .maybeSingle()

    if (!user1) {
      console.log(`   ⚠️  User not found, creating new user...`)
      const hashedPassword1 = await bcrypt.hash(password1, 10)
      await supabase.from('users').insert({
        email: email1,
        name: 'dimo',
        password: hashedPassword1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      console.log(`   ✅ User created with password: ${password1}`)
    } else {
      const hashedPassword1 = await bcrypt.hash(password1, 10)
      await supabase
        .from('users')
        .update({ password: hashedPassword1, updatedAt: new Date().toISOString() })
        .eq('email', email1)
      console.log(`   ✅ Password reset to: ${password1}`)
    }

    // Reset password for second user
    const email2 = 'dimitrinicholson7@gmail.com'
    const password2 = 'password123'
    
    console.log(`\n📧 Resetting password for ${email2}...`)
    const { data: user2 } = await supabase
      .from('users')
      .select('id')
      .eq('email', email2)
      .maybeSingle()

    if (!user2) {
      console.log(`   ⚠️  User not found, creating new user...`)
      const hashedPassword2 = await bcrypt.hash(password2, 10)
      await supabase.from('users').insert({
        email: email2,
        name: 'test',
        password: hashedPassword2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      console.log(`   ✅ User created with password: ${password2}`)
    } else {
      const hashedPassword2 = await bcrypt.hash(password2, 10)
      await supabase
        .from('users')
        .update({ password: hashedPassword2, updatedAt: new Date().toISOString() })
        .eq('email', email2)
      console.log(`   ✅ Password reset to: ${password2}`)
    }

    console.log('\n🎉 Password reset complete!')
    console.log('\n📝 Your login credentials:')
    console.log('   Account 1:')
    console.log(`      Email: ${email1}`)
    console.log(`      Password: ${password1}`)
    console.log('\n   Account 2:')
    console.log(`      Email: ${email2}`)
    console.log(`      Password: ${password2}`)
    console.log('\n✅ You can now sign in on Vercel!')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

resetPasswords()
