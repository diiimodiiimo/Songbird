import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getUserIdFromClerk } from '@/lib/clerk-sync'

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ users: [] })
    }

    const supabase = getSupabase()

    // Get all users except current user
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('id, name, email, image, username')
      .neq('id', userId)

    if (error) throw error

    const queryLower = query.toLowerCase()
    const users = (allUsers || [])
      .filter(
        (user) =>
          user.name?.toLowerCase().includes(queryLower) ||
          user.email?.toLowerCase().includes(queryLower) ||
          user.username?.toLowerCase().includes(queryLower)
      )
      .slice(0, 10)

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('[users/search] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to search users', message: error?.message },
      { status: 500 }
    )
  }
}
