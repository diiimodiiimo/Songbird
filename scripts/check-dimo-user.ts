/**
 * Check the current state of the dimo user account
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDimoUser() {
  console.log('Checking user account for dimotesi44@gmail.com...\n')

  // Find by email
  const { data: userByEmail, error: emailError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'dimotesi44@gmail.com')
    .maybeSingle()

  if (emailError) {
    console.error('Error finding user by email:', emailError)
    return
  }

  if (!userByEmail) {
    console.log('NO USER FOUND with email dimotesi44@gmail.com!')
    return
  }

  console.log('User record found:')
  console.log('==================')
  console.log('ID:', userByEmail.id)
  console.log('Email:', userByEmail.email)
  console.log('Username:', userByEmail.username || '(NULL)')
  console.log('Name:', userByEmail.name || '(NULL)')
  console.log('Has Image:', userByEmail.image ? 'YES (base64 or URL)' : 'NO')
  console.log('ClerkId:', userByEmail.clerkId || '(NULL)')
  console.log('Created:', userByEmail.createdAt)
  console.log('Updated:', userByEmail.updatedAt)
  console.log('')

  // Check if username exists anywhere
  const { data: dimoUser } = await supabase
    .from('users')
    .select('id, email, username')
    .eq('username', 'dimo')
    .maybeSingle()

  if (dimoUser) {
    console.log('User with username "dimo" exists:')
    console.log('  ID:', dimoUser.id)
    console.log('  Email:', dimoUser.email)
  } else {
    console.log('No user with username "dimo" exists in the database.')
  }

  // Check how many entries this user has
  const { count: entriesCount } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('userId', userByEmail.id)

  console.log(`\nThis user has ${entriesCount || 0} entries.`)

  // If username is null, we can fix it
  if (!userByEmail.username) {
    console.log('\n⚠️  Username is NULL. To restore to "dimo", run:')
    console.log('  npx tsx scripts/check-dimo-user.ts --fix')
  }

  if (process.argv.includes('--fix') && !userByEmail.username) {
    console.log('\n🔧 Restoring username to "dimo"...')
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        username: 'dimo',
        updatedAt: new Date().toISOString()
      })
      .eq('id', userByEmail.id)

    if (updateError) {
      console.error('Error updating username:', updateError)
    } else {
      console.log('✅ Username restored to "dimo"!')
    }
  }
}

checkDimoUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })



