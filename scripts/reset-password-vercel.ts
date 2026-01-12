import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Connect directly to the production Supabase database
const DATABASE_URL = 'postgresql://postgres:D1modadreamo4979@db.undbrbgtjgslmoswqaww.supabase.co:5432/postgres'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
})

async function resetPasswords() {
  try {
    console.log('🔗 Connecting to production database...')
    console.log('   Database: Supabase PostgreSQL\n')

    // Reset password for first user
    const email1 = 'dimotesi44@gmail.com'
    const password1 = 'password123'
    
    console.log(`📧 Resetting password for ${email1}...`)
    const user1 = await prisma.user.findUnique({
      where: { email: email1 },
    })

    if (!user1) {
      console.log(`   ⚠️  User not found, creating new user...`)
      const hashedPassword1 = await bcrypt.hash(password1, 10)
      await prisma.user.create({
        data: {
          email: email1,
          name: 'dimo',
          password: hashedPassword1,
        },
      })
      console.log(`   ✅ User created with password: ${password1}`)
    } else {
      const hashedPassword1 = await bcrypt.hash(password1, 10)
      await prisma.user.update({
        where: { email: email1 },
        data: { password: hashedPassword1 },
      })
      console.log(`   ✅ Password reset to: ${password1}`)
    }

    // Reset password for second user
    const email2 = 'dimitrinicholson7@gmail.com'
    const password2 = 'password123'
    
    console.log(`\n📧 Resetting password for ${email2}...`)
    const user2 = await prisma.user.findUnique({
      where: { email: email2 },
    })

    if (!user2) {
      console.log(`   ⚠️  User not found, creating new user...`)
      const hashedPassword2 = await bcrypt.hash(password2, 10)
      await prisma.user.create({
        data: {
          email: email2,
          name: 'test',
          password: hashedPassword2,
        },
      })
      console.log(`   ✅ User created with password: ${password2}`)
    } else {
      const hashedPassword2 = await bcrypt.hash(password2, 10)
      await prisma.user.update({
        where: { email: email2 },
        data: { password: hashedPassword2 },
      })
      console.log(`   ✅ Password reset to: ${password2}`)
    }

    console.log('\n🎉 Password reset complete!')
    console.log('\n📝 Your login credentials:')
    console.log('   Account 1:')
    console.log(`      Email: ${email1}`)
    console.log(`      Password: ${password1}`)
    console.log('\n   Account 2:')
    console.log(`      Email: ${email2}`)
    console.log(`      Password: ${password2}`)
    console.log('\n✅ You can now sign in on Vercel!')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.message.includes('P1001')) {
      console.error('\n⚠️  Could not connect to database. Check your DATABASE_URL.')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetPasswords()




