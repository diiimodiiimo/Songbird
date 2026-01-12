import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPassword() {
  const email = process.argv[2]
  const newPassword = process.argv[3] || 'password123'

  if (!email) {
    console.log('Usage: npx tsx scripts/reset-password.ts <email> [newPassword]')
    console.log('\nExample:')
    console.log('  npx tsx scripts/reset-password.ts dimotesi44@gmail.com mynewpassword')
    process.exit(1)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    console.log(`✅ Password reset for ${email}`)
    console.log(`   New password: ${newPassword}`)
  } catch (error: any) {
    console.error('❌ Error resetting password:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetPassword()




