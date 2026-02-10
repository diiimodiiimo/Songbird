import { getScriptSupabase } from './supabase-client'

const supabase = getScriptSupabase()

async function migrateUserToClerk() {
  try {
    const email = process.argv[2]
    
    if (!email) {
      console.error('Usage: npx tsx scripts/migrate-user-to-clerk.ts <email>')
      console.error('Example: npx tsx scripts/migrate-user-to-clerk.ts dimotesi44@gmail.com')
      process.exit(1)
    }

    console.log(`\n🔍 Looking for user with email: ${email}\n`)

    // Find user in database
    const { data: dbUser, error: findError } = await supabase
      .from('users')
      .select('id, email, name, clerkId, entries(count)')
      .eq('email', email)
      .maybeSingle()

    if (findError) throw findError

    if (!dbUser) {
      console.error(`❌ User with email "${email}" not found in database`)
      console.error('\nAvailable users:')
      const { data: allUsers } = await supabase
        .from('users')
        .select('email, name')
      allUsers?.forEach((u: any) => {
        console.error(`  - ${u.email} (${u.name || 'No name'})`)
      })
      process.exit(1)
    }

    const entryCount = dbUser.entries?.[0]?.count ?? 0

    console.log(`✓ Found database user:`)
    console.log(`  ID: ${dbUser.id}`)
    console.log(`  Email: ${dbUser.email}`)
    console.log(`  Name: ${dbUser.name || 'No name'}`)
    console.log(`  Current Clerk ID: ${dbUser.clerkId || 'None'}`)
    console.log(`  Entries: ${entryCount}`)

    if (dbUser.clerkId) {
      console.log(`\n⚠️  User already has a Clerk ID: ${dbUser.clerkId}`)
      console.log('This will update it to the new Clerk account.')
    }

    // Get Clerk user by email using Clerk API
    console.log(`\n🔍 Looking for Clerk user with email: ${email}\n`)

    // Use hardcoded key (same as in next.config.js)
    const clerkApiKey = 'sk_test_ItopDjxx3irW16Y07vAItJ681quUhnaPTTlyRjs9od'
    if (!clerkApiKey) {
      console.error('❌ CLERK_SECRET_KEY not found in environment variables')
      console.error('Please set CLERK_SECRET_KEY in your .env.local file')
      process.exit(1)
    }

    // Search for user by email in Clerk using REST API
    const response = await fetch('https://api.clerk.com/v1/users', {
      headers: {
        'Authorization': `Bearer ${clerkApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Clerk API error: ${response.status} ${response.statusText}`)
    }

    const allClerkUsers = await response.json()
    
    // Find user by email (case-insensitive)
    const clerkUser = allClerkUsers.find((u: any) => 
      u.email_addresses?.some((e: any) => 
        e.email_address?.toLowerCase() === email.toLowerCase()
      )
    )

    if (!clerkUser) {
      console.error(`❌ No Clerk user found with email "${email}"`)
      console.error('\nPlease make sure:')
      console.error('1. You have signed up/signed in with Clerk using this email')
      console.error('2. The email matches exactly')
      console.error('\nAvailable Clerk users:')
      allClerkUsers.slice(0, 5).forEach((u: any) => {
        const email = u.email_addresses?.[0]?.email_address || 'No email'
        console.error(`  - ${email} (ID: ${u.id})`)
      })
      process.exit(1)
    }

    console.log(`✓ Found Clerk user:`)
    console.log(`  Clerk ID: ${clerkUser.id}`)
    console.log(`  Email: ${clerkUser.email_addresses[0]?.email_address}`)
    console.log(`  Name: ${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || 'No name')

    // Update database user with Clerk ID
    console.log(`\n🔗 Linking database user to Clerk account...\n`)

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ clerkId: clerkUser.id })
      .eq('id', dbUser.id)
      .select('id, clerkId, email')
      .single()

    if (updateError) throw updateError

    console.log(`✅ Successfully linked user!`)
    console.log(`   Database User ID: ${updatedUser.id}`)
    console.log(`   Clerk User ID: ${updatedUser.clerkId}`)
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`\n🎉 Migration complete! Your data should now be accessible.`)
    console.log(`\n💡 Refresh your browser to see your data.`)

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

migrateUserToClerk()
