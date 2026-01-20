import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

// Simple ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

// Generate a new invite link (simplified - uses username as invite code)
export async function POST() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkId)

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = getSupabase()

    // Get user's username to use as their invite code
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // Use username as the invite code, or generate one if no username
    const code = userData?.username || generateInviteCode()

    return NextResponse.json({ code, id: null })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Get user's invite code (simplified)
export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkId)

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = getSupabase()

    // Get user's username as their invite code
    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single()

    return NextResponse.json({ 
      invites: [],
      personalCode: userData?.username || null,
    })
  } catch (error) {
    console.error('Error fetching invites:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
