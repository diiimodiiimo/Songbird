import { prisma } from './prisma'
import { currentUser } from '@clerk/nextjs/server'

/**
 * Get the Prisma user ID from Clerk user ID
 * This syncs Clerk users with our database automatically
 */
export async function getPrismaUserIdFromClerk(clerkUserId: string): Promise<string | null> {
  if (!clerkUserId) return null

  // For dimotesi44@gmail.com - the user ID IS the Clerk ID
  // So we can just return the Clerk ID directly if it exists as a user ID
  try {
    // First check if Clerk ID matches a user ID directly (your case)
    const userById = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { id: true },
    })
    
    if (userById) {
      return userById.id
    }

    // Then check by clerkId field
    const userByClerkId = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    })
    
    if (userByClerkId) {
      return userByClerkId.id
    }

    // Finally, try by email
    const clerkUser = await currentUser()
    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress
      if (email) {
        const userByEmail = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        })
        
        if (userByEmail) {
          // Update with clerkId
          await prisma.user.update({
            where: { id: userByEmail.id },
            data: { clerkId: clerkUserId },
          })
          return userByEmail.id
        }
      }
    }
  } catch (error) {
    console.error('Error in getPrismaUserIdFromClerk:', error)
    // Fallback: return Clerk ID directly if it looks like a user ID
    return clerkUserId
  }

  return null
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

