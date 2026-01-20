import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    // Check if username is valid format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ available: false, reason: 'Invalid format' })
    }

    const supabase = getSupabase()

    // Check if username is taken
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id, clerkId')
      .eq('username', username.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which means username is available
      throw error
    }

    if (!existingUser) {
      return NextResponse.json({ available: true })
    }

    // If it's the current user's username, it's "available" for them
    if (clerkId && existingUser.clerkId === clerkId) {
      return NextResponse.json({ available: true, isCurrentUser: true })
    }

    return NextResponse.json({ available: false, reason: 'Already taken' })
  } catch (error) {
    console.error('Error checking username:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
