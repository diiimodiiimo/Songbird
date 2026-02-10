/**
 * List all users in the database to check for any issues
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

async function checkAllUsers() {
  console.log('Fetching all users from database...\n')

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, username, name, clerkId, createdAt, image')
    .order('createdAt', { ascending: true })

  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  console.log(`Found ${users?.length || 0} users:\n`)
  console.log('=' .repeat(100))

  for (const user of users || []) {
    console.log(`ID: ${user.id}`)
    console.log(`Email: ${user.email}`)
    console.log(`Username: ${user.username || '(NULL)'}`)
    console.log(`Name: ${user.name || '(NULL)'}`)
    console.log(`ClerkId: ${user.clerkId || '(NULL)'}`)
    console.log(`Has Image: ${user.image ? 'YES' : 'NO'}`)
    console.log(`Created: ${user.createdAt}`)
    console.log('-'.repeat(100))
  }
}

checkAllUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })






