import { PrismaClient } from '@prisma/client'

// Direct connection to Supabase - using direct URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:D1modadreamo4979@db.undbrbgtjgslmoswqaww.supabase.co:5432/postgres',
    },
  },
})

async function linkClerkUser() {
  try {
    const email = 'dimotesi44@gmail.com'
    const clerkId = 'user_388dqr3cH3WoTbL8RCxt1HAIx0o'

    console.log(`\n🔍 Looking for user: ${email}\n`)

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { email },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    })

    if (!dbUser) {
      console.error(`❌ User with email "${email}" not found in database`)
      console.error('\nAvailable users:')
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true, clerkId: true },
        take: 10,
      })
      allUsers.forEach((u) => {
        console.error(`  - ${u.email} (${u.name || 'No name'}) - Clerk ID: ${u.clerkId || 'None'}`)
      })
      process.exit(1)
    }

    console.log(`✓ Found database user:`)
    console.log(`  ID: ${dbUser.id}`)
    console.log(`  Email: ${dbUser.email}`)
    console.log(`  Name: ${dbUser.name || 'No name'}`)
    console.log(`  Current Clerk ID: ${dbUser.clerkId || 'None'}`)
    console.log(`  Entries: ${dbUser._count.entries}`)

    if (dbUser.clerkId === clerkId) {
      console.log(`\n✅ User is already linked to this Clerk account!`)
      process.exit(0)
    }

    if (dbUser.clerkId) {
      console.log(`\n⚠️  User already has a different Clerk ID: ${dbUser.clerkId}`)
      console.log(`   Will update to: ${clerkId}`)
    }

    // Update user with Clerk ID
    console.log(`\n🔗 Linking user to Clerk account...\n`)

    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { clerkId: clerkId },
    })

    console.log(`✅ Successfully linked user!`)
    console.log(`   Database User ID: ${updatedUser.id}`)
    console.log(`   Clerk User ID: ${updatedUser.clerkId}`)
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Entries: ${dbUser._count.entries}`)
    console.log(`\n🎉 Migration complete! Your data should now be accessible.`)
    console.log(`\n💡 Refresh your browser at http://localhost:3000`)

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

linkClerkUser()

