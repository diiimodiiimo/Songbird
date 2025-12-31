import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getUserID() {
  try {
    const email = process.argv[2]
    
    if (!email) {
      console.log('Usage: npx tsx scripts/get-user-id.ts <your-email>')
      console.log('\nExample: npx tsx scripts/get-user-id.ts dimotesi44@gmail.com')
      process.exit(1)
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      console.error(`User with email ${email} not found`)
      process.exit(1)
    }

    console.log('\n=== Your User Information ===')
    console.log(`Email: ${user.email}`)
    console.log(`Name: ${user.name || 'Not set'}`)
    console.log(`\nUser ID: ${user.id}`)
    console.log('\nCopy this ID and use it for the import command:')
    console.log(`npm run import:direct ${user.id}`)
  } catch (error: any) {
    console.error('Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

getUserID()




