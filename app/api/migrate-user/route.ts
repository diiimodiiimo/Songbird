import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

// POST - Link current Clerk user to existing database user by email
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Clerk user info
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Clerk user not found' }, { status: 404 })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found in Clerk account' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Find user in database by email
    const { data: dbUser, error: findError } = await supabase
      .from('users')
      .select('id, email, name, clerkId')
      .eq('email', email)
      .maybeSingle()

    if (findError) throw findError

    if (!dbUser) {
      return NextResponse.json(
        { 
          error: 'User not found in database',
          message: `No database user found with email: ${email}`,
        },
        { status: 404 }
      )
    }

    // Get entry count
    const { count: entriesCount } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('userId', dbUser.id)

    // Check if user already has a different Clerk ID
    if (dbUser.clerkId && dbUser.clerkId !== clerkUserId) {
      return NextResponse.json(
        {
          error: 'User already linked to different Clerk account',
          message: `This email is already linked to Clerk ID: ${dbUser.clerkId}`,
        },
        { status: 400 }
      )
    }

    // Update user with Clerk ID
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ clerkId: clerkUserId, updatedAt: new Date().toISOString() })
      .eq('id', dbUser.id)
      .select('id, email, name, clerkId')
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: 'User successfully linked to Clerk account',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        clerkId: updatedUser.clerkId,
        entriesCount: entriesCount || 0,
      },
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        error: 'Migration failed',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

