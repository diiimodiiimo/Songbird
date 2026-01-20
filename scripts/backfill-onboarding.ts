/**
 * Backfill script for existing users
 * Sets onboardingCompletedAt to createdAt for all existing users
 * so they don't see the onboarding flow
 * 
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-onboarding.ts
 * Or: npx tsx scripts/backfill-onboarding.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting onboarding backfill...')

  // Find all users without onboardingCompletedAt
  const usersToUpdate = await prisma.user.findMany({
    where: {
      onboardingCompletedAt: null,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  })

  console.log(`Found ${usersToUpdate.length} users to backfill`)

  // Update each user
  for (const user of usersToUpdate) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingCompletedAt: user.createdAt,
      },
    })
    console.log(`  ✓ Updated ${user.email}`)
  }

  console.log('Backfill complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

