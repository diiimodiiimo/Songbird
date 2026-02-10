import { getScriptSupabase } from './supabase-client'

// Note: This script previously used Prisma + better-sqlite3 to migrate from SQLite to PostgreSQL.
// Since we no longer use Prisma, this script uses Supabase for the PostgreSQL side.
// You still need 'better-sqlite3' installed to read from SQLite.

let sqlite3: any
try {
  sqlite3 = require('better-sqlite3')
} catch {
  console.error('❌ better-sqlite3 is not installed. Run: npm install better-sqlite3')
  process.exit(1)
}

const supabase = getScriptSupabase()

async function migrateUsers() {
  console.log('🚀 Migrating users from SQLite to Supabase...\n')

  try {
    // Connect to SQLite directly
    const db = sqlite3.default('./prisma/dev.db')
    
    // Read users from SQLite
    const users = db.prepare('SELECT * FROM users').all() as any[]
    console.log(`Found ${users.length} users in SQLite\n`)

    // Migrate each user to Supabase (PostgreSQL)
    for (const user of users) {
      try {
        const { error } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            password: user.password,
            image: user.image,
            bio: user.bio,
            favoriteArtists: user.favoriteArtists,
            favoriteSongs: user.favoriteSongs,
            createdAt: new Date(user.createdAt).toISOString(),
            updatedAt: new Date(user.updatedAt).toISOString(),
          }, { onConflict: 'id' })

        if (error) throw error
        console.log(`✅ Migrated user: ${user.email}`)
      } catch (error: any) {
        console.error(`❌ Error migrating ${user.email}:`, error.message)
      }
    }

    db.close()
    console.log('\n🎉 User migration complete!')
    console.log('\nYou can now sign in with your existing credentials.')
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

migrateUsers()
