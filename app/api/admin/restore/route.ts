import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

/**
 * EMERGENCY RESTORE ENDPOINT
 * Restores username "dimo" and checks all users
 */
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, email } = body

    const supabase = getSupabase()

    if (action === 'restore_dimo') {
      // Restore dimo's username
      const { data: user, error } = await supabase
        .from('users')
        .update({ username: 'dimo' })
        .eq('email', 'dimotesi44@gmail.com')
        .select('id, email, username, image')
        .single()

      if (error) {
        return NextResponse.json({ error: 'Restore failed', details: error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Username restored to "dimo"',
        user,
      })
    }

    if (action === 'check_all_users') {
      // Check all users for missing usernames/images
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, username, image, name')
        .limit(100)

      if (error) {
        return NextResponse.json({ error: 'Query failed', details: error }, { status: 500 })
      }

      const affected = users?.filter(u => !u.username || !u.image) || []
      const total = users?.length || 0

      return NextResponse.json({
        total,
        affected: affected.length,
        users: affected.map(u => ({
          email: u.email,
          name: u.name,
          username: u.username,
          hasImage: !!u.image,
        })),
      })
    }

    if (action === 'restore_user' && email) {
      // Restore a specific user - try to get username from name or email
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id, email, username, image, name')
        .eq('email', email)
        .single()

      if (fetchError || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const updateData: Record<string, any> = {}

      // If no username, try to create one from name or email
      if (!user.username) {
        if (user.name) {
          // Use first name or first part of name
          const firstName = user.name.split(' ')[0].toLowerCase()
          updateData.username = firstName
        } else if (user.email) {
          // Use email prefix
          updateData.username = user.email.split('@')[0]
        }
      }

      if (Object.keys(updateData).length > 0) {
        const { data: updated, error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id)
          .select('id, email, username, image')
          .single()

        if (updateError) {
          return NextResponse.json({ error: 'Update failed', details: updateError }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'User restored',
          user: updated,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'User already has username',
        user,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error in restore:', error)
    return NextResponse.json(
      { error: 'Failed', message: error?.message },
      { status: 500 }
    )
  }
}



