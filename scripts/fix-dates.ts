import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDates() {
  try {
    console.log('Fetching all entries...')
    const entries = await prisma.entry.findMany({
      select: {
        id: true,
        date: true,
        songTitle: true,
      },
    })

    console.log(`Found ${entries.length} entries to fix\n`)

    let fixed = 0
    let errors = 0

    for (const entry of entries) {
      try {
        // Get the current date as a string (YYYY-MM-DD)
        const currentDateStr = new Date(entry.date).toISOString().split('T')[0]
        
        // Subtract one day
        const currentDate = new Date(currentDateStr + 'T12:00:00.000Z')
        currentDate.setDate(currentDate.getDate() - 1)
        
        // Format as YYYY-MM-DD and create new date at noon UTC
        const fixedDateStr = currentDate.toISOString().split('T')[0]
        const fixedDate = new Date(fixedDateStr + 'T12:00:00.000Z')

        // Update the entry
        await prisma.entry.update({
          where: { id: entry.id },
          data: { date: fixedDate },
        })

        fixed++
        console.log(`✓ Fixed: ${entry.songTitle} - ${currentDateStr} → ${fixedDateStr}`)
      } catch (error: any) {
        console.error(`✗ Error fixing entry ${entry.id}: ${error.message}`)
        errors++
      }
    }

    console.log('\n=== Fix Summary ===')
    console.log(`✓ Fixed: ${fixed}`)
    console.log(`✗ Errors: ${errors}`)
    console.log(`Total: ${entries.length}`)
  } catch (error: any) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixDates()






