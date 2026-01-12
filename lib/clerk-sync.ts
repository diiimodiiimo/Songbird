import { prisma } from './prisma'

// In-memory cache for clerk-to-prisma user ID mapping
// This drastically reduces database calls on serverless
const userIdCache = new Map<string, { id: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get the Prisma user ID from Clerk user ID
 * OPTIMIZED: Single database query with in-memory caching
 */
export async function getPrismaUserIdFromClerk(clerkUserId: string): Promise<string | null> {
  if (!clerkUserId) return null

  // Check cache first
  const cached = userIdCache.get(clerkUserId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.id
  }

  try {
    // OPTIMIZED: Single query that checks both id and clerkId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: clerkUserId },
          { clerkId: clerkUserId },
        ],
      },
      select: { id: true },
    })

    if (user) {
      // Cache the result
      userIdCache.set(clerkUserId, { id: user.id, timestamp: Date.now() })
      return user.id
    }

    // If not found by id/clerkId, we need email lookup
    // This is a fallback for first-time users - import currentUser lazily
    const { currentUser } = await import('@clerk/nextjs/server')
    const clerkUser = await currentUser()
    
    if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
      const email = clerkUser.emailAddresses[0].emailAddress
      
      const userByEmail = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })

      if (userByEmail) {
        // Link clerkId for future lookups (fire and forget)
        prisma.user.update({
          where: { id: userByEmail.id },
          data: { clerkId: clerkUserId },
        }).catch(() => {}) // Non-blocking update
        
        // Cache the result
        userIdCache.set(clerkUserId, { id: userByEmail.id, timestamp: Date.now() })
        return userByEmail.id
      }
    }

    return null
  } catch (error) {
    console.error('Error in getPrismaUserIdFromClerk:', error)
    return null
  }
}

/**
 * Helper to get Prisma user ID from Clerk auth
 * Use this in API routes to convert Clerk userId to database userId
 */
export async function getPrismaUserId(): Promise<string | null> {
  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  if (!userId) return null
  return await getPrismaUserIdFromClerk(userId)
}

