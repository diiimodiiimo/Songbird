import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function importEntries() {
  try {
    const userId = process.argv[2]
    if (!userId) {
      console.error('Please provide your user ID as an argument')
      console.error('Usage: npx tsx scripts/import-direct.ts <your-user-id>')
      process.exit(1)
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error(`User with ID ${userId} not found`)
      process.exit(1)
    }

    console.log(`Importing entries for user: ${user.email}`)

    // Load entries from JSON file
    const entriesPath = path.join(process.cwd(), 'scripts', 'entries_to_import.json')
    if (!fs.existsSync(entriesPath)) {
      console.error('entries_to_import.json not found. Please run the Python script first.')
      console.error('Run: python scripts/import_from_sheets.py <your-user-id>')
      process.exit(1)
    }

    const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'))
    console.log(`Found ${entries.length} entries to import\n`)

    let imported = 0
    let skipped = 0
    let errors = 0

    for (const entry of entries) {
      try {
        const date = new Date(entry.date)
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date: ${entry.date}`)
          skipped++
          continue
        }

        // Check if entry already exists
        const existing = await prisma.entry.findUnique({
          where: {
            userId_date: {
              userId: userId,
              date: date,
            },
          },
        })

        if (existing) {
          console.log(`⊘ Already exists: ${entry.songTitle} (${entry.date})`)
          skipped++
          continue
        }

        // Create entry
        await prisma.entry.create({
          data: {
            date: date,
            userId: userId,
            songTitle: entry.songTitle,
            artist: entry.artist,
            albumTitle: entry.albumTitle || 'Unknown',
            albumArt: entry.albumArt || '',
            durationMs: entry.durationMs || 0,
            explicit: entry.explicit || false,
            popularity: entry.popularity || 0,
            releaseDate: entry.releaseDate || null,
            trackId: entry.trackId || '',
            uri: entry.uri || '',
            notes: entry.notes || null,
          },
        })

        imported++
        console.log(`✓ Imported: ${entry.songTitle} by ${entry.artist} (${entry.date})`)
      } catch (error: any) {
        console.error(`✗ Error: ${entry.songTitle} - ${error.message}`)
        errors++
      }
    }

    console.log('\n=== Import Summary ===')
    console.log(`✓ Imported: ${imported}`)
    console.log(`⊘ Skipped: ${skipped}`)
    console.log(`✗ Errors: ${errors}`)
    console.log(`Total: ${entries.length}`)
  } catch (error: any) {
    console.error('Import failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importEntries()







