import { getScriptSupabase } from './supabase-client'
import * as fs from 'fs'
import * as path from 'path'

const supabase = getScriptSupabase()

async function importEntries() {
  try {
    const userId = process.argv[2]
    if (!userId) {
      console.error('Please provide your user ID as an argument')
      console.error('Usage: npx tsx scripts/import-direct.ts <your-user-id>')
      process.exit(1)
    }

    // Verify user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error

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

        const dateStr = date.toISOString().split('T')[0]
        const startOfDay = `${dateStr}T00:00:00.000Z`
        const endOfDay = `${dateStr}T23:59:59.999Z`

        // Check if entry already exists
        const { data: existing } = await supabase
          .from('entries')
          .select('id')
          .eq('userId', userId)
          .gte('date', startOfDay)
          .lte('date', endOfDay)
          .maybeSingle()

        if (existing) {
          console.log(`⊘ Already exists: ${entry.songTitle} (${entry.date})`)
          skipped++
          continue
        }

        // Create entry
        const { error: insertError } = await supabase
          .from('entries')
          .insert({
            date: date.toISOString(),
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })

        if (insertError) throw insertError

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
  }
}

importEntries()
