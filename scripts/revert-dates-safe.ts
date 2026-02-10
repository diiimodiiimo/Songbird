import { getScriptSupabase } from './supabase-client'

const supabase = getScriptSupabase()

async function revertDatesSafe() {
  try {
    console.log('Fetching all entries...')
    const { data: entries, error } = await supabase
      .from('entries')
      .select('id, date, songTitle, userId')
      .order('date', { ascending: true })

    if (error) throw error

    console.log(`Found ${entries.length} entries to revert\n`)

    // Step 1: Move all dates to a temporary offset (add 1000 days) to avoid conflicts
    console.log('Step 1: Moving dates to temporary offset...')
    let tempFixed = 0
    for (const entry of entries) {
      try {
        const currentDateStr = new Date(entry.date).toISOString().split('T')[0]
        const tempDate = new Date(currentDateStr + 'T12:00:00.000Z')
        tempDate.setDate(tempDate.getDate() + 1000) // Move to far future

        const { error: updateError } = await supabase
          .from('entries')
          .update({ date: tempDate.toISOString() })
          .eq('id', entry.id)

        if (updateError) throw updateError
        tempFixed++
      } catch (error: any) {
        console.error(`✗ Error moving entry ${entry.id} to temp: ${error.message}`)
      }
    }
    console.log(`✓ Moved ${tempFixed} entries to temporary dates\n`)

    // Step 2: Now move them all to correct dates (add 1 day from original)
    console.log('Step 2: Moving dates to correct values...')
    let fixed = 0
    let errors = 0

    for (const entry of entries) {
      try {
        // Get the original date (before my fix, which subtracted 1 day)
        // So we need to add 1 day back
        const currentDateStr = new Date(entry.date).toISOString().split('T')[0]
        const currentDate = new Date(currentDateStr + 'T12:00:00.000Z')
        
        // Subtract 1000 days (to get back to the "wrong" date), then add 1 day
        currentDate.setDate(currentDate.getDate() - 1000 + 1)
        
        const fixedDateStr = currentDate.toISOString().split('T')[0]
        const fixedDate = new Date(fixedDateStr + 'T12:00:00.000Z')

        const { error: updateError } = await supabase
          .from('entries')
          .update({ date: fixedDate.toISOString() })
          .eq('id', entry.id)

        if (updateError) throw updateError

        fixed++
        if (fixed % 100 === 0) {
          console.log(`  Progress: ${fixed}/${entries.length}...`)
        }
      } catch (error: any) {
        console.error(`✗ Error fixing entry ${entry.id}: ${error.message}`)
        errors++
      }
    }

    console.log('\n=== Revert Summary ===')
    console.log(`✓ Fixed: ${fixed}`)
    console.log(`✗ Errors: ${errors}`)
    console.log(`Total: ${entries.length}`)
  } catch (error: any) {
    console.error('Revert failed:', error.message)
    process.exit(1)
  }
}

revertDatesSafe()
