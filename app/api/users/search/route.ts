import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Convert Clerk user ID to Prisma user ID
    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ users: [] })
    }

    // SQLite doesn't support case-insensitive mode, so we'll filter in memory
    const allUsers = await prisma.user.findMany({
      where: {
        NOT: { id: userId },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    const queryLower = query.toLowerCase()
    const users = allUsers
      .filter(
        (user) =>
          user.name?.toLowerCase().includes(queryLower) ||
          user.email.toLowerCase().includes(queryLower)
      )
      .slice(0, 10)

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    )
  }
}

