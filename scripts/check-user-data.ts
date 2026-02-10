import { getScriptSupabase } from './supabase-client'

const supabase = getScriptSupabase()

async function checkUserData() {
  try {
    const email = 'dimotesi44@gmail.com'
    const clerkId = 'user_388dqr3cH3WoTbL8RCxt1HAIx0o'

    console.log(`\n🔍 Checking user data for: ${email}\n`)

    // Find all users with this email
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, clerkId, entries(count)')
      .eq('email', email)

    if (usersError) throw usersError

    console.log(`Found ${users.length} user(s) with this email:\n`)
    users.forEach((user: any, idx: number) => {
      console.log(`User ${idx + 1}:`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Name: ${user.name || 'No name'}`)
      console.log(`  Clerk ID: ${user.clerkId || 'None'}`)
      console.log(`  Entries: ${user.entries?.[0]?.count ?? 0}`)
      console.log('')
    })

    // Check entries - find entries by email's user
    if (users.length > 0) {
      const firstUser = users[0]
      console.log(`\n📊 Checking entries for user ID: ${firstUser.id}\n`)
      
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('id, date, songTitle, artist, userId')
        .eq('userId', firstUser.id)
        .order('date', { ascending: false })
        .limit(5)

      if (entriesError) throw entriesError

      console.log(`Found ${entries.length} sample entries (showing first 5):\n`)
      entries.forEach((entry: any) => {
        console.log(`  - ${new Date(entry.date).toISOString().split('T')[0]}: ${entry.songTitle} by ${entry.artist}`)
        console.log(`    User ID: ${entry.userId}`)
      })

      // Check if there are entries with different user IDs
      const { data: allUserIds, error: userIdsError } = await supabase
        .from('entries')
        .select('userId')
        .limit(10)

      if (userIdsError) throw userIdsError

      const uniqueUserIds = [...new Set(allUserIds.map((e: any) => e.userId))]
      console.log(`\n📋 Unique user IDs in entries table (first 10):\n`)
      uniqueUserIds.forEach((userId: string) => {
        console.log(`  - ${userId}`)
      })
    }

    // Find user by clerkId
    console.log(`\n🔍 Looking for user with Clerk ID: ${clerkId}\n`)
    const { data: userByClerkId, error: clerkError } = await supabase
      .from('users')
      .select('id, email, name, clerkId, entries(count)')
      .eq('clerkId', clerkId)
      .maybeSingle()

    if (clerkError) throw clerkError

    if (userByClerkId) {
      console.log(`✓ Found user by Clerk ID:`)
      console.log(`  ID: ${userByClerkId.id}`)
      console.log(`  Email: ${userByClerkId.email}`)
      console.log(`  Entries: ${userByClerkId.entries?.[0]?.count ?? 0}`)
    } else {
      console.log(`❌ No user found with Clerk ID: ${clerkId}`)
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
  }
}

checkUserData()
