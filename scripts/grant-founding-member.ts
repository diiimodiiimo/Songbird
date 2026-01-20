/**
 * Grant Founding Flock membership to a user by email
 * 
 * Usage:
 *   npx tsx scripts/grant-founding-member.ts friend@email.com
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error('❌ Usage: npx tsx scripts/grant-founding-member.ts <email>')
    console.error('   Example: npx tsx scripts/grant-founding-member.ts friend@email.com')
    process.exit(1)
  }

  console.log(`🔍 Looking for user with email: ${email}`)

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      isPremium: true,
      isFoundingMember: true,
    },
  })

  if (!user) {
    console.error(`❌ User not found with email: ${email}`)
    console.error('   Make sure the user has signed up first.')
    process.exit(1)
  }

  if (user.isPremium && user.isFoundingMember) {
    console.log(`✅ User is already a Founding Flock member!`)
    console.log(`   Name: ${user.name || user.username || 'N/A'}`)
    console.log(`   Email: ${user.email}`)
    process.exit(0)
  }

  // Grant founding membership
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isPremium: true,
      isFoundingMember: true,
      premiumSince: new Date(),
    },
  })

  console.log(`🎉 Successfully granted Founding Flock membership!`)
  console.log(`   Name: ${updatedUser.name || updatedUser.username || 'N/A'}`)
  console.log(`   Email: ${updatedUser.email}`)
  console.log(`   Premium Since: ${updatedUser.premiumSince?.toISOString()}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

