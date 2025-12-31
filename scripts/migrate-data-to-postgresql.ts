/**
 * Migration Script: SQLite → PostgreSQL
 * 
 * This script migrates data from your SQLite database to PostgreSQL.
 * 
 * Usage:
 * 1. Make sure both databases are set up
 * 2. Set SQLITE_DATABASE_URL in .env (temporary)
 * 3. Run: npx tsx scripts/migrate-data-to-postgresql.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaClient as SQLiteClient } from '@prisma/client'

// You'll need to temporarily create a SQLite Prisma client
// This is a simplified version - you may need to adjust based on your setup

async function migrateData() {
  console.log('🚀 Starting data migration from SQLite to PostgreSQL...\n')

  // SQLite connection (source)
  const sqliteClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.SQLITE_DATABASE_URL || 'file:./dev.db',
      },
    },
  })

  // PostgreSQL connection (destination)
  const postgresClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  try {
    // Check PostgreSQL connection
    await postgresClient.$connect()
    console.log('✅ Connected to PostgreSQL\n')

    // Check SQLite connection
    await sqliteClient.$connect()
    console.log('✅ Connected to SQLite\n')

    // Migrate Users
    console.log('📦 Migrating users...')
    const users = await sqliteClient.user.findMany()
    console.log(`   Found ${users.length} users`)
    
    for (const user of users) {
      try {
        await postgresClient.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            name: user.name,
            username: user.username,
            password: user.password,
            image: user.image,
            bio: user.bio,
            favoriteArtists: user.favoriteArtists,
            favoriteSongs: user.favoriteSongs,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
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
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        })
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating user ${user.email}:`, error.message)
      }
    }
    console.log('   ✅ Users migrated\n')

    // Migrate Entries
    console.log('📦 Migrating entries...')
    const entries = await sqliteClient.entry.findMany()
    console.log(`   Found ${entries.length} entries`)
    
    for (const entry of entries) {
      try {
        await postgresClient.entry.upsert({
          where: { id: entry.id },
          update: {
            date: entry.date,
            userId: entry.userId,
            songTitle: entry.songTitle,
            artist: entry.artist,
            albumTitle: entry.albumTitle,
            albumArt: entry.albumArt,
            durationMs: entry.durationMs,
            explicit: entry.explicit,
            popularity: entry.popularity,
            releaseDate: entry.releaseDate,
            trackId: entry.trackId,
            uri: entry.uri,
            notes: entry.notes,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          },
          create: {
            id: entry.id,
            date: entry.date,
            userId: entry.userId,
            songTitle: entry.songTitle,
            artist: entry.artist,
            albumTitle: entry.albumTitle,
            albumArt: entry.albumArt,
            durationMs: entry.durationMs,
            explicit: entry.explicit,
            popularity: entry.popularity,
            releaseDate: entry.releaseDate,
            trackId: entry.trackId,
            uri: entry.uri,
            notes: entry.notes,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          },
        })
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating entry ${entry.id}:`, error.message)
      }
    }
    console.log('   ✅ Entries migrated\n')

    // Migrate Person References
    console.log('📦 Migrating person references...')
    const people = await sqliteClient.personReference.findMany()
    console.log(`   Found ${people.length} person references`)
    
    for (const person of people) {
      try {
        await postgresClient.personReference.upsert({
          where: { id: person.id },
          update: {
            entryId: person.entryId,
            name: person.name,
            userId: person.userId,
            source: person.source,
            createdAt: person.createdAt,
          },
          create: {
            id: person.id,
            entryId: person.entryId,
            name: person.name,
            userId: person.userId,
            source: person.source,
            createdAt: person.createdAt,
          },
        })
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating person ${person.id}:`, error.message)
      }
    }
    console.log('   ✅ Person references migrated\n')

    // Migrate Mentions
    console.log('📦 Migrating mentions...')
    const mentions = await sqliteClient.mention.findMany()
    console.log(`   Found ${mentions.length} mentions`)
    
    for (const mention of mentions) {
      try {
        await postgresClient.mention.upsert({
          where: { id: mention.id },
          update: {
            entryId: mention.entryId,
            userId: mention.userId,
            createdAt: mention.createdAt,
          },
          create: {
            id: mention.id,
            entryId: mention.entryId,
            userId: mention.userId,
            createdAt: mention.createdAt,
          },
        })
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating mention ${mention.id}:`, error.message)
      }
    }
    console.log('   ✅ Mentions migrated\n')

    // Migrate Entry Tags
    console.log('📦 Migrating entry tags...')
    const tags = await sqliteClient.entryTag.findMany()
    console.log(`   Found ${tags.length} entry tags`)
    
    for (const tag of tags) {
      try {
        await postgresClient.entryTag.upsert({
          where: { id: tag.id },
          update: {
            entryId: tag.entryId,
            userId: tag.userId,
            createdAt: tag.createdAt,
          },
          create: {
            id: tag.id,
            entryId: tag.entryId,
            userId: tag.userId,
            createdAt: tag.createdAt,
          },
        })
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating tag ${tag.id}:`, error.message)
      }
    }
    console.log('   ✅ Entry tags migrated\n')

    // Migrate Friend Requests
    console.log('📦 Migrating friend requests...')
    const friendRequests = await sqliteClient.friendRequest.findMany()
    console.log(`   Found ${friendRequests.length} friend requests`)
    
    for (const fr of friendRequests) {
      try {
        await postgresClient.friendRequest.upsert({
          where: { id: fr.id },
          update: {
            senderId: fr.senderId,
            receiverId: fr.receiverId,
            status: fr.status,
            createdAt: fr.createdAt,
            updatedAt: fr.updatedAt,
          },
          create: {
            id: fr.id,
            senderId: fr.senderId,
            receiverId: fr.receiverId,
            status: fr.status,
            createdAt: fr.createdAt,
            updatedAt: fr.updatedAt,
          },
        })
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating friend request ${fr.id}:`, error.message)
      }
    }
    console.log('   ✅ Friend requests migrated\n')

    // Migrate Notifications
    console.log('📦 Migrating notifications...')
    const notifications = await sqliteClient.notification.findMany()
    console.log(`   Found ${notifications.length} notifications`)
    
    for (const notif of notifications) {
      try {
        await postgresClient.notification.upsert({
          where: { id: notif.id },
          update: {
            userId: notif.userId,
            type: notif.type,
            relatedId: notif.relatedId,
            read: notif.read,
            createdAt: notif.createdAt,
          },
          create: {
            id: notif.id,
            userId: notif.userId,
            type: notif.type,
            relatedId: notif.relatedId,
            read: notif.read,
            createdAt: notif.createdAt,
          },
        })
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating notification ${notif.id}:`, error.message)
      }
    }
    console.log('   ✅ Notifications migrated\n')

    console.log('🎉 Migration complete!\n')
    console.log('Next steps:')
    console.log('1. Test your app: npm run dev')
    console.log('2. Verify data in Prisma Studio: npx prisma studio')
    console.log('3. Remove SQLITE_DATABASE_URL from .env if you added it')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await sqliteClient.$disconnect()
    await postgresClient.$disconnect()
  }
}

migrateData()


