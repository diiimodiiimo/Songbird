import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function revertDates() {
  try {
    console.log('Fetching all entries...')
    const entries = await prisma.entry.findMany({
      select: {
        id: true,
        date: true,
        songTitle: true,
      },
    })

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
        await prisma.entry.update({
          where: { id: entry.id },
          data: { date: fixedDate },
        })

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
  } finally {
    await prisma.$disconnect()
  }
}

revertDates()






