import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

/**
 * Admin endpoint to check and restore user data
 * This will show what's in the database and allow restoration from Clerk if needed
 */
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get email from query params
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'dimotesi44@gmail.com'

    const supabase = getSupabase()

    // Get user from database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, username, image, clerkId, isPremium, isFoundingMember')
      .eq('email', email)
      .maybeSingle()

    if (dbError) {
      return NextResponse.json({ error: 'Database error', details: dbError }, { status: 500 })
    }

    // Get Clerk user data
    const clerkUser = await currentUser()
    const clerkData = clerkUser ? {
      id: clerkUser.id,
      username: clerkUser.username,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      email: clerkUser.emailAddresses?.[0]?.emailAddress,
    } : null

    return NextResponse.json({
      database: dbUser,
      clerk: clerkData,
      message: 'Check the database field - if username/image are null or wrong, use POST to restore',
    })
  } catch (error: any) {
    console.error('Error checking user:', error)
    return NextResponse.json(
      { error: 'Failed to check user', message: error?.message },
      { status: 500 }
    )
  }
}

/**
 * Restore user data - will restore from Clerk if database is missing data
 */
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, restoreFromClerk = false, customUsername, customImage } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Get user from database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, email, username, image')
      .eq('email', email)
      .maybeSingle()

    if (dbError || !dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}

    if (restoreFromClerk) {
      // Restore from Clerk
      const clerkUser = await currentUser()
      if (clerkUser) {
        if (!dbUser.username && clerkUser.username) {
          updateData.username = clerkUser.username
        }
        if (!dbUser.image && clerkUser.imageUrl) {
          updateData.image = clerkUser.imageUrl
        }
      }
    }

    // Use custom values if provided (for manual restoration)
    if (customUsername) {
      updateData.username = customUsername
    }
    if (customImage) {
      updateData.image = customImage
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updates to make' }, { status: 400 })
    }

    updateData.updatedAt = new Date().toISOString()

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', dbUser.id)
      .select('id, email, username, image')
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Update failed', details: updateError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User data restored',
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('Error restoring user:', error)
    return NextResponse.json(
      { error: 'Failed to restore user', message: error?.message },
      { status: 500 }
    )
  }
}


