import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

// Debug endpoint to check what's in the database for the current user
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress

    const supabase = getSupabase()
    
    // Find ALL users matching this clerkId OR email (to detect duplicates)
    const { data: allMatches, error: matchError } = await supabase
      .from('users')
      .select('id, email, username, image, clerkId, createdAt, name')
      .or(`clerkId.eq.${clerkUserId},email.eq.${email}`)
    
    // Also find user by clerkId specifically  
    const { data: userByClerkId } = await supabase
      .from('users')
      .select('*')
      .eq('clerkId', clerkUserId)
      .maybeSingle()

    // Find user by email
    const { data: userByEmail } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    // Check for duplicates
    const hasDuplicates = allMatches && allMatches.length > 1

    return NextResponse.json({ 
      clerkUserId,
      email,
      
      // How many records match?
      matchCount: allMatches?.length || 0,
      hasDuplicates,
      
      // All matching records (to see if there are duplicates)
      allMatchingRecords: allMatches?.map(u => ({
        id: u.id,
        email: u.email,
        username: u.username,
        hasImage: !!u.image,
        clerkId: u.clerkId,
        createdAt: u.createdAt,
      })),
      
      // Which user is returned by clerkId lookup?
      userByClerkId: userByClerkId ? {
        id: userByClerkId.id,
        username: userByClerkId.username,
        image: userByClerkId.image ? 'exists' : 'null',
        email: userByClerkId.email,
      } : null,
      
      // Which user is returned by email lookup?
      userByEmail: userByEmail ? {
        id: userByEmail.id,
        username: userByEmail.username,
        image: userByEmail.image ? 'exists' : 'null',
        email: userByEmail.email,
      } : null,

      // Full record for the clerkId user
      fullRecord: userByClerkId,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Error', 
      message: error?.message 
    }, { status: 500 })
  }
}

// Fix endpoint to restore username and profile pic
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const body = await request.json()
    const { username, image } = body

    const supabase = getSupabase()
    
    const { data: user, error } = await supabase
      .from('users')
      .update({ 
        username: username || null,
        image: image || null,
        updatedAt: new Date().toISOString()
      })
      .eq('clerkId', clerkUserId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Update failed', details: error }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      user,
      message: 'Profile updated!'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

