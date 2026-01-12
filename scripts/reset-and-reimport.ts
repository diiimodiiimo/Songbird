import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetAndReimport() {
  try {
    const userId = process.argv[2]
    
    if (!userId) {
      console.error('Usage: tsx scripts/reset-and-reimport.ts <userId>')
      console.error('\nTo find your user ID, run: npm run get-user-id <your-email>')
      process.exit(1)
    }

    console.log('⚠️  WARNING: This will delete ALL entries for this user!')
    console.log(`User ID: ${userId}\n`)

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      console.error(`Error: User with ID "${userId}" not found`)
      process.exit(1)
    }

    console.log(`Found user: ${user.email} (${user.name || 'No name'})`)
    console.log('\nDeleting all entries...')

    // Delete all entries for this user (tags will be deleted automatically due to cascade)
    const deleteResult = await prisma.entry.deleteMany({
      where: { userId },
    })

    console.log(`✓ Deleted ${deleteResult.count} entries\n`)
    console.log('✅ Database reset complete!')
    console.log('\nNow you can re-import your data from Google Sheets:')
    console.log('1. Run: python scripts/import_from_sheets.py <your-user-id>')
    console.log('2. Then run: npm run import:direct <your-user-id>')
  } catch (error: any) {
    console.error('Reset failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetAndReimport()






