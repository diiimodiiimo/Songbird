import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// For Vercel serverless: Use DATABASE_URL (pooled connection via pgbouncer)
// DIRECT_URL is only for migrations, not runtime queries
// Pooled connections are REQUIRED for serverless to avoid connection exhaustion
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL environment variable is required in production')
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Don't specify datasources - let Prisma use DATABASE_URL from schema
  })

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}
