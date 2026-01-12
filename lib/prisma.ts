import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use DIRECT_URL if available (bypasses pooler), otherwise fall back to DATABASE_URL
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL or DIRECT_URL environment variable is required in production')
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}
