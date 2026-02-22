import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { z } from 'zod'
import { getUserIdFromClerk } from '@/lib/clerk-sync'

const PROFILE_FIELDS = 'id, email, name, username, image, bio, gender, theme, onboardingCompletedAt, favoriteArtists, favoriteSongs, isPremium, isFoundingMember, inviteCode'
const PROFILE_FIELDS_MINIMAL = 'id, email, name, username, image, bio, gender, favoriteArtists, favoriteSongs'

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let supabase
    try {
      supabase = getSupabase()
    } catch (supabaseError: any) {
      console.error('[profile] Failed to initialize Supabase:', supabaseError)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        message: supabaseError?.message || 'Failed to initialize Supabase client.' 
      }, { status: 500 })
    }

    const userId = await getUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    let user = null
    let queryError = null

    // Try full field set first, fall back to minimal if columns don't exist
    let result = await supabase
      .from('users')
      .select(PROFILE_FIELDS)
      .eq('id', userId)
      .maybeSingle()

    if (result.error && (result.error.code === 'PGRST204' || result.error.message?.includes('column'))) {
      result = await supabase
        .from('users')
        .select(PROFILE_FIELDS_MINIMAL)
        .eq('id', userId)
        .maybeSingle()
    }

    if (result.error) {
      queryError = result.error
    } else if (result.data) {
      user = result.data
    }

    // Fallback: try by clerkId
    if (!user && !queryError) {
      const fallback = await supabase
        .from('users')
        .select(PROFILE_FIELDS_MINIMAL)
        .eq('clerkId', clerkUserId)
        .maybeSingle()

      if (fallback.data) user = fallback.data
      if (fallback.error && !queryError) queryError = fallback.error
    }

    // Fallback: try by email
    if (!user) {
      const clerkUser = await currentUser()
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress

      if (email) {
        const emailResult = await supabase
          .from('users')
          .select(PROFILE_FIELDS_MINIMAL)
          .eq('email', email)
          .maybeSingle()

        if (emailResult.data) user = emailResult.data
        if (emailResult.error && !queryError) queryError = emailResult.error
      }
    }

    if (queryError && !user) {
      console.error('[profile] Query failed:', queryError.message)
      return NextResponse.json({ 
        error: 'Failed to fetch user from database', 
        message: queryError.message 
      }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const responseUser = {
      ...user,
      favoriteArtists: user.favoriteArtists ? JSON.parse(user.favoriteArtists) : [],
      favoriteSongs: user.favoriteSongs ? JSON.parse(user.favoriteSongs) : [],
    }

    const response = NextResponse.json({ user: responseUser })
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
    return response
  } catch (error: any) {
    console.error('[profile] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch profile', message: error?.message },
      { status: 500 }
    )
  }
}

const validThemes = [
  'american-robin',
  'northern-cardinal',
  'eastern-bluebird',
  'american-goldfinch',
  'baltimore-oriole',
  'indigo-bunting',
  'house-finch',
  'cedar-waxwing',
  'black-capped-chickadee',
  'painted-bunting',
] as const

const updateProfileSchema = z.object({
  username: z
    .string()
    .max(50)
    .transform((val) => (val.trim() === '' ? null : val.trim()))
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
  gender: z
    .enum(['male', 'female', 'non-binary', 'prefer-not-to-say'])
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
  theme: z
    .enum(validThemes)
    .optional(),
  profileVisible: z
    .boolean()
    .optional(),
})

export async function PUT(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    const supabase = getSupabase()

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

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    }
    if (data.username !== undefined) updateData.username = data.username || null
    if (data.image !== undefined) updateData.image = data.image || null
    if (data.bio !== undefined) updateData.bio = data.bio || null
    if (data.gender !== undefined) updateData.gender = data.gender || null
    if (data.favoriteArtists !== undefined) updateData.favoriteArtists = JSON.stringify(data.favoriteArtists || [])
    if (data.favoriteSongs !== undefined) updateData.favoriteSongs = JSON.stringify(data.favoriteSongs || [])
    if (data.theme !== undefined) updateData.theme = data.theme

    // Try update; if it fails due to missing column, retry without optional columns
    let updatedUser = null
    const { data: result, error: err1 } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(PROFILE_FIELDS_MINIMAL)
      .single()

    if (err1) {
      if (err1.code === '42703' || err1.code === 'PGRST204' || err1.message?.includes('column')) {
        delete updateData.theme
        const { data: result2, error: err2 } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select(PROFILE_FIELDS_MINIMAL)
          .single()

        if (err2) {
          console.error('[profile] Update failed:', err2.message)
          return NextResponse.json(
            { error: err2.message || 'Failed to update profile' },
            { status: 500 }
          )
        }
        updatedUser = result2
      } else {
        console.error('[profile] Update failed:', err1.message)
        return NextResponse.json(
          { error: err1.message || 'Failed to update profile' },
          { status: 500 }
        )
      }
    } else {
      updatedUser = result
    }

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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
    console.error('[profile] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to update profile', message: error?.message },
      { status: 500 }
    )
  }
}
