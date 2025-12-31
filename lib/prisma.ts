import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In production (Vercel), DATABASE_URL must be set and should use the pooler
// In development, use direct connection from .env or fallback to SQLite
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL environment variable is required in production')
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db'
}

// Prisma will automatically use the DATABASE_URL from environment
// - Local dev: Uses direct connection from .env (port 5432)
// - Vercel production: Uses pooler connection from Vercel env vars (port 6543)
const databaseUrl = process.env.DATABASE_URL

// Log which connection we're using (for debugging)
if (process.env.NODE_ENV === 'development') {
  const isPooler = databaseUrl.includes('pooler') || databaseUrl.includes(':6543')
  console.log(`Database connection: ${isPooler ? 'Pooler' : 'Direct'}`)
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// Reuse the client globally to avoid connection issues
// This works in both Node.js (dev) and Vercel serverless (production)
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

