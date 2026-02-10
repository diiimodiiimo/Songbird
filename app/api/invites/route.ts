import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getUserIdFromClerk } from '@/lib/clerk-sync'

// Simple ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

// Generate a new invite link
export async function POST() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getUserIdFromClerk(clerkId)

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = getSupabase()

    // Get user's invite code (should already exist from user creation)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('inviteCode, username')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // If user doesn't have an invite code, generate one
    let code = userData?.inviteCode
    if (!code) {
      code = generateInviteCode()
      // Update user with invite code
      await supabase
        .from('users')
        .update({ inviteCode: code })
        .eq('id', userId)
    }

    return NextResponse.json({ 
      code,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join/${code}`,
    })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Get user's invite code and link
export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getUserIdFromClerk(clerkId)

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = getSupabase()

    // Get user's invite code
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('inviteCode, username')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // If user doesn't have an invite code, generate one
    let code = userData?.inviteCode
    if (!code) {
      code = generateInviteCode()
      await supabase
        .from('users')
        .update({ inviteCode: code })
        .eq('id', userId)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({ 
      invites: [],
      personalCode: code,
      inviteUrl: `${baseUrl}/join/${code}`,
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
