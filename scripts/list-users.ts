import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        _count: {
          select: {
            entries: true,
          },
        },
      },
    })

    console.log('\n=== All Users ===\n')
    users.forEach((user) => {
      console.log(`Email: ${user.email}`)
      console.log(`Name: ${user.name || 'N/A'}`)
      console.log(`User ID: ${user.id}`)
      console.log(`Entries: ${user._count.entries}`)
      console.log('---\n')
    })

    if (users.length === 0) {
      console.log('No users found.')
    }
  } catch (error: any) {
    console.error('Error listing users:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()





