/**
 * Generate invite codes for all users who don't have one
 * 
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/generate-invite-codes.ts
 * Or: npx tsx scripts/generate-invite-codes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function main() {
  console.log('Generating invite codes...')

  // Find all users without invite codes
  const usersWithoutCodes = await prisma.user.findMany({
    where: {
      inviteCode: null,
    },
    select: {
      id: true,
      email: true,
    },
  })

  console.log(`Found ${usersWithoutCodes.length} users without invite codes`)

  // Generate unique codes
  const existingCodes = new Set(
    (await prisma.user.findMany({
      where: { inviteCode: { not: null } },
      select: { inviteCode: true },
    })).map(u => u.inviteCode)
  )

  for (const user of usersWithoutCodes) {
    let code: string
    do {
      code = generateInviteCode()
    } while (existingCodes.has(code))

    existingCodes.add(code)

    await prisma.user.update({
      where: { id: user.id },
      data: { inviteCode: code },
    })
    console.log(`  ✓ ${user.email}: ${code}`)
  }

  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())






