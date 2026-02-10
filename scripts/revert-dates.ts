import { getScriptSupabase } from './supabase-client'

const supabase = getScriptSupabase()

async function revertDates() {
  try {
    console.log('Fetching all entries...')
    const { data: entries, error } = await supabase
      .from('entries')
      .select('id, date, songTitle')

    if (error) throw error

    console.log(`Found ${entries.length} entries to revert\n`)

    let fixed = 0
    let errors = 0

    for (const entry of entries) {
      try {
        // Get the current date as a string (YYYY-MM-DD)
        const currentDateStr = new Date(entry.date).toISOString().split('T')[0]
        
        // Add one day back
        const currentDate = new Date(currentDateStr + 'T12:00:00.000Z')
        currentDate.setDate(currentDate.getDate() + 1)
        
        // Format as YYYY-MM-DD and create new date at noon UTC
        const fixedDateStr = currentDate.toISOString().split('T')[0]
        const fixedDate = new Date(fixedDateStr + 'T12:00:00.000Z')

        // Update the entry
        const { error: updateError } = await supabase
          .from('entries')
          .update({ date: fixedDate.toISOString() })
          .eq('id', entry.id)

        if (updateError) throw updateError

        fixed++
        console.log(`✓ Reverted: ${entry.songTitle} - ${currentDateStr} → ${fixedDateStr}`)
      } catch (error: any) {
        console.error(`✗ Error reverting entry ${entry.id}: ${error.message}`)
        errors++
      }
    }

    console.log('\n=== Revert Summary ===')
    console.log(`✓ Reverted: ${fixed}`)
    console.log(`✗ Errors: ${errors}`)
    console.log(`Total: ${entries.length}`)
  } catch (error: any) {
    console.error('Revert failed:', error.message)
    process.exit(1)
  }
}

revertDates()
