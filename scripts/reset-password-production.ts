import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// This script uses DATABASE_URL from environment
// For production, set DATABASE_URL to your Supabase connection string
const prisma = new PrismaClient()

async function resetPassword() {
  const email = process.argv[2]
  const newPassword = process.argv[3] || 'password123'

  if (!email) {
    console.log('Usage: DATABASE_URL="your-postgres-url" npx tsx scripts/reset-password-production.ts <email> [newPassword]')
    console.log('\nExample:')
    console.log('  DATABASE_URL="postgresql://..." npx tsx scripts/reset-password-production.ts dimotesi44@gmail.com mynewpassword')
    console.log('\nOr set DATABASE_URL in .env and run:')
    console.log('  npx tsx scripts/reset-password-production.ts dimotesi44@gmail.com mynewpassword')
    process.exit(1)
  }

  try {
    console.log(`Connecting to database: ${process.env.DATABASE_URL?.substring(0, 50)}...`)
    
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      process.exit(1)
    }

    console.log(`Found user: ${user.email} (${user.name || 'no name'})`)

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    console.log(`✅ Password reset for ${email}`)
    console.log(`   New password: ${newPassword}`)
    console.log(`\nYou can now sign in with:`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${newPassword}`)
  } catch (error: any) {
    console.error('❌ Error resetting password:', error.message)
    if (error.message.includes('P1001')) {
      console.error('\n⚠️  Database connection failed. Make sure DATABASE_URL is set correctly.')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetPassword()



