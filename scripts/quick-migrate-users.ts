import { PrismaClient } from '@prisma/client'
import * as sqlite3 from 'better-sqlite3'

const postgres = new PrismaClient()

async function migrateUsers() {
  console.log('🚀 Migrating users from SQLite to PostgreSQL...\n')

  try {
    // Connect to SQLite directly
    const db = sqlite3.default('./prisma/dev.db')
    
    // Read users from SQLite
    const users = db.prepare('SELECT * FROM users').all() as any[]
    console.log(`Found ${users.length} users in SQLite\n`)

    // Migrate each user to PostgreSQL
    for (const user of users) {
      try {
        await postgres.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            name: user.name,
            username: user.username,
            password: user.password, // Keep the hashed password
            image: user.image,
            bio: user.bio,
            favoriteArtists: user.favoriteArtists,
            favoriteSongs: user.favoriteSongs,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            password: user.password,
            image: user.image,
            bio: user.bio,
            favoriteArtists: user.favoriteArtists,
            favoriteSongs: user.favoriteSongs,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
        })
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
  } finally {
    await postgres.$disconnect()
  }
}

migrateUsers()



