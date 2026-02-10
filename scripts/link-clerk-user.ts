import { getScriptSupabase } from './supabase-client'

const supabase = getScriptSupabase()

async function linkClerkUser() {
  try {
    const email = 'dimotesi44@gmail.com'
    const clerkId = 'user_388dqr3cH3WoTbL8RCxt1HAIx0o'

    console.log(`\n🔍 Looking for user: ${email}\n`)

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
        .select('email, name, clerkId')
        .limit(10)
      allUsers?.forEach((u: any) => {
        console.error(`  - ${u.email} (${u.name || 'No name'}) - Clerk ID: ${u.clerkId || 'None'}`)
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

    if (dbUser.clerkId === clerkId) {
      console.log(`\n✅ User is already linked to this Clerk account!`)
      process.exit(0)
    }

    if (dbUser.clerkId) {
      console.log(`\n⚠️  User already has a different Clerk ID: ${dbUser.clerkId}`)
      console.log(`   Will update to: ${clerkId}`)
    }

    // Update user with Clerk ID
    console.log(`\n🔗 Linking user to Clerk account...\n`)

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ clerkId: clerkId })
      .eq('id', dbUser.id)
      .select('id, clerkId, email')
      .single()

    if (updateError) throw updateError

    console.log(`✅ Successfully linked user!`)
    console.log(`   Database User ID: ${updatedUser.id}`)
    console.log(`   Clerk User ID: ${updatedUser.clerkId}`)
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Entries: ${entryCount}`)
    console.log(`\n🎉 Migration complete! Your data should now be accessible.`)
    console.log(`\n💡 Refresh your browser at http://localhost:3000`)

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

linkClerkUser()
