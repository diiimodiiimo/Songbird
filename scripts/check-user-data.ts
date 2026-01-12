import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:D1modadreamo4979@db.undbrbgtjgslmoswqaww.supabase.co:5432/postgres',
    },
  },
})

async function checkUserData() {
  try {
    const email = 'dimotesi44@gmail.com'
    const clerkId = 'user_388dqr3cH3WoTbL8RCxt1HAIx0o'

    console.log(`\n🔍 Checking user data for: ${email}\n`)

    // Find all users with this email
    const users = await prisma.user.findMany({
      where: { email },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    })

    console.log(`Found ${users.length} user(s) with this email:\n`)
    users.forEach((user, idx) => {
      console.log(`User ${idx + 1}:`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Name: ${user.name || 'No name'}`)
      console.log(`  Clerk ID: ${user.clerkId || 'None'}`)
      console.log(`  Entries: ${user._count.entries}`)
      console.log('')
    })

    // Check entries - find entries by email's user
    if (users.length > 0) {
      const firstUser = users[0]
      console.log(`\n📊 Checking entries for user ID: ${firstUser.id}\n`)
      
      const entries = await prisma.entry.findMany({
        where: { userId: firstUser.id },
        take: 5,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          songTitle: true,
          artist: true,
          userId: true,
        },
      })

      console.log(`Found ${entries.length} sample entries (showing first 5):\n`)
      entries.forEach((entry) => {
        console.log(`  - ${entry.date.toISOString().split('T')[0]}: ${entry.songTitle} by ${entry.artist}`)
        console.log(`    User ID: ${entry.userId}`)
      })

      // Check if there are entries with different user IDs
      const allUserIds = await prisma.entry.findMany({
        select: { userId: true },
        distinct: ['userId'],
        take: 10,
      })

      console.log(`\n📋 Unique user IDs in entries table (first 10):\n`)
      allUserIds.forEach((e) => {
        console.log(`  - ${e.userId}`)
      })
    }

    // Find user by clerkId
    console.log(`\n🔍 Looking for user with Clerk ID: ${clerkId}\n`)
    const userByClerkId = await prisma.user.findUnique({
      where: { clerkId: clerkId },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    })

    if (userByClerkId) {
      console.log(`✓ Found user by Clerk ID:`)
      console.log(`  ID: ${userByClerkId.id}`)
      console.log(`  Email: ${userByClerkId.email}`)
      console.log(`  Entries: ${userByClerkId._count.entries}`)
    } else {
      console.log(`❌ No user found with Clerk ID: ${clerkId}`)
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkUserData()


