import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ users: [] })
    }

    // SQLite doesn't support case-insensitive mode, so we'll filter in memory
    const allUsers = await prisma.user.findMany({
      where: {
        NOT: { id: session.user.id },
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

