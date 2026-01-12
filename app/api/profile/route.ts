import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { z } from 'zod'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const supabase = getSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, username, image, bio, favoriteArtists, favoriteSongs')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.error('[profile] Error fetching user:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse JSON fields for response
    const responseUser = {
      ...user,
      favoriteArtists: user.favoriteArtists ? JSON.parse(user.favoriteArtists) : [],
      favoriteSongs: user.favoriteSongs ? JSON.parse(user.favoriteSongs) : [],
    }

    const response = NextResponse.json({ user: responseUser })
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
    return response
  } catch (error: any) {
    console.error('Error fetching profile:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch profile', message: error?.message },
      { status: 500 }
    )
  }
}

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .transform((val) => val.trim().toLowerCase())
    .optional()
    .nullable(),
  image: z
    .string()
    .transform((val) => (val.trim() === '' ? null : val.trim()))
    .refine((val) => val === null || z.string().url().safeParse(val).success || val.startsWith('data:image'), {
      message: 'Must be a valid URL, base64 data URI, or empty',
    })
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(160)
    .transform((val) => (val.trim() === '' ? null : val.trim()))
    .optional()
    .nullable(),
  favoriteArtists: z
    .array(z.string())
    .optional()
    .nullable(),
  favoriteSongs: z
    .array(z.object({
      songTitle: z.string(),
      artist: z.string(),
    }))
    .optional()
    .nullable(),
})

export async function PUT(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    const supabase = getSupabase()

    // Check if username is already taken (if provided)
    if (data.username) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', data.username)
        .neq('id', userId)
        .maybeSingle()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    }
    if (data.username !== undefined) updateData.username = data.username || null
    if (data.image !== undefined) updateData.image = data.image || null
    if (data.bio !== undefined) updateData.bio = data.bio || null
    if (data.favoriteArtists !== undefined) updateData.favoriteArtists = JSON.stringify(data.favoriteArtists || [])
    if (data.favoriteSongs !== undefined) updateData.favoriteSongs = JSON.stringify(data.favoriteSongs || [])

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, username, image, bio, favoriteArtists, favoriteSongs')
      .single()

    if (error) {
      console.error('[profile] Update error:', error)
      throw error
    }

    // Parse JSON fields for response
    const responseUser = {
      ...updatedUser,
      favoriteArtists: updatedUser.favoriteArtists ? JSON.parse(updatedUser.favoriteArtists) : [],
      favoriteSongs: updatedUser.favoriteSongs ? JSON.parse(updatedUser.favoriteSongs) : [],
    }

    return NextResponse.json({ user: responseUser })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating profile:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to update profile', message: error?.message },
      { status: 500 }
    )
  }
}
