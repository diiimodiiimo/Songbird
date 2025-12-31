import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In production, DATABASE_URL must be set
// In development, fallback to SQLite for local testing
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL environment variable is required in production')
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db'
}

// For serverless (Vercel), we need to handle connection pooling
// Supabase connection string should use the pooler: change port from 5432 to 6543
// Or use the direct connection with connection_limit=1 for serverless
const databaseUrl = process.env.DATABASE_URL

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

// In serverless environments, don't reuse the client across requests
// But in Node.js (development), reuse it to avoid too many connections
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Handle graceful shutdown
if (process.env.NODE_ENV === 'production') {
  // In serverless, ensure connections are closed after each request
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

