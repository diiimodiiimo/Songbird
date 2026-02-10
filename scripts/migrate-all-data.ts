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

async function migrateAllData() {
  console.log('🚀 Migrating ALL data from SQLite to Supabase...\n')

  const db = sqlite3.default('./prisma/dev.db')

  try {
    // 1. Migrate Users
    console.log('📦 Migrating users...')
    const users = db.prepare('SELECT * FROM users').all() as any[]
    console.log(`   Found ${users.length} users`)
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
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating user ${user.email}:`, error.message)
      }
    }
    console.log('   ✅ Users migrated\n')

    // 2. Migrate Entries
    console.log('📦 Migrating entries...')
    const entries = db.prepare('SELECT * FROM entries').all() as any[]
    console.log(`   Found ${entries.length} entries`)
    let entryCount = 0
    for (const entry of entries) {
      try {
        const { error } = await supabase
          .from('entries')
          .upsert({
            id: entry.id,
            date: new Date(entry.date).toISOString(),
            userId: entry.userId,
            songTitle: entry.songTitle,
            artist: entry.artist,
            albumTitle: entry.albumTitle,
            albumArt: entry.albumArt,
            durationMs: entry.durationMs,
            explicit: entry.explicit ? true : false,
            popularity: entry.popularity,
            releaseDate: entry.releaseDate,
            trackId: entry.trackId,
            uri: entry.uri,
            notes: entry.notes,
            createdAt: new Date(entry.createdAt).toISOString(),
            updatedAt: new Date(entry.updatedAt).toISOString(),
          }, { onConflict: 'id' })
        if (error) throw error
        entryCount++
        if (entryCount % 100 === 0) {
          console.log(`   Migrated ${entryCount}/${entries.length} entries...`)
        }
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating entry ${entry.id}:`, error.message)
      }
    }
    console.log(`   ✅ ${entryCount} entries migrated\n`)

    // 3. Migrate Person References
    console.log('📦 Migrating person references...')
    const people = db.prepare('SELECT * FROM person_references').all() as any[]
    console.log(`   Found ${people.length} person references`)
    for (const person of people) {
      try {
        const { error } = await supabase
          .from('person_references')
          .upsert({
            id: person.id,
            entryId: person.entryId,
            name: person.name,
            userId: person.userId,
            source: person.source,
            createdAt: new Date(person.createdAt).toISOString(),
          }, { onConflict: 'id' })
        if (error) throw error
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating person ${person.id}:`, error.message)
      }
    }
    console.log('   ✅ Person references migrated\n')

    // 4. Migrate Mentions
    console.log('📦 Migrating mentions...')
    const mentions = db.prepare('SELECT * FROM mentions').all() as any[]
    console.log(`   Found ${mentions.length} mentions`)
    for (const mention of mentions) {
      try {
        const { error } = await supabase
          .from('mentions')
          .upsert({
            id: mention.id,
            entryId: mention.entryId,
            userId: mention.userId,
            createdAt: new Date(mention.createdAt).toISOString(),
          }, { onConflict: 'id' })
        if (error) throw error
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating mention ${mention.id}:`, error.message)
      }
    }
    console.log('   ✅ Mentions migrated\n')

    // 5. Migrate Entry Tags
    console.log('📦 Migrating entry tags...')
    const tags = db.prepare('SELECT * FROM entry_tags').all() as any[]
    console.log(`   Found ${tags.length} entry tags`)
    for (const tag of tags) {
      try {
        const { error } = await supabase
          .from('entry_tags')
          .upsert({
            id: tag.id,
            entryId: tag.entryId,
            userId: tag.userId,
            createdAt: new Date(tag.createdAt).toISOString(),
          }, { onConflict: 'id' })
        if (error) throw error
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating tag ${tag.id}:`, error.message)
      }
    }
    console.log('   ✅ Entry tags migrated\n')

    // 6. Migrate Friend Requests
    console.log('📦 Migrating friend requests...')
    const friendRequests = db.prepare('SELECT * FROM friend_requests').all() as any[]
    console.log(`   Found ${friendRequests.length} friend requests`)
    for (const fr of friendRequests) {
      try {
        const { error } = await supabase
          .from('friend_requests')
          .upsert({
            id: fr.id,
            senderId: fr.senderId,
            receiverId: fr.receiverId,
            status: fr.status,
            createdAt: new Date(fr.createdAt).toISOString(),
            updatedAt: new Date(fr.updatedAt).toISOString(),
          }, { onConflict: 'id' })
        if (error) throw error
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating friend request ${fr.id}:`, error.message)
      }
    }
    console.log('   ✅ Friend requests migrated\n')

    // 7. Migrate Notifications
    console.log('📦 Migrating notifications...')
    const notifications = db.prepare('SELECT * FROM notifications').all() as any[]
    console.log(`   Found ${notifications.length} notifications`)
    for (const notif of notifications) {
      try {
        const { error } = await supabase
          .from('notifications')
          .upsert({
            id: notif.id,
            userId: notif.userId,
            type: notif.type,
            relatedId: notif.relatedId,
            read: notif.read ? true : false,
            createdAt: new Date(notif.createdAt).toISOString(),
          }, { onConflict: 'id' })
        if (error) throw error
      } catch (error: any) {
        console.error(`   ⚠️  Error migrating notification ${notif.id}:`, error.message)
      }
    }
    console.log('   ✅ Notifications migrated\n')

    db.close()
    console.log('🎉 ALL data migration complete!\n')
    console.log('Your full history has been restored to Supabase PostgreSQL.')
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

migrateAllData()
