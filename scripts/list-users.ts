import { getScriptSupabase } from './supabase-client'

const supabase = getScriptSupabase()

async function listUsers() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name')

    if (error) throw error

    // Get entry counts per user
    console.log('\n=== All Users ===\n')
    for (const user of users || []) {
      const { count } = await supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('userId', user.id)

      console.log(`Email: ${user.email}`)
      console.log(`Name: ${user.name || 'N/A'}`)
      console.log(`User ID: ${user.id}`)
      console.log(`Entries: ${count || 0}`)
      console.log('---\n')
    }

    if (!users || users.length === 0) {
      console.log('No users found.')
    }
  } catch (error: any) {
    console.error('Error listing users:', error.message)
    process.exit(1)
  }
}

listUsers()
