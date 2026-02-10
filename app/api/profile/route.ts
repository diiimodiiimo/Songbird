import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { z } from 'zod'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[profile] Clerk user ID:', clerkUserId)

    // Initialize Supabase first to catch any initialization errors
    let supabase
    try {
      supabase = getSupabase()
    } catch (supabaseError: any) {
      console.error('[profile] Failed to initialize Supabase:', supabaseError)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        message: supabaseError?.message || 'Failed to initialize Supabase client. Check environment variables.' 
      }, { status: 500 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    console.log('[profile] Database user ID:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }
    
    // DISABLED SYNC - Don't sync Clerk data to avoid overwriting custom usernames/images
    // Users can manually update their profile if needed

    console.log('[profile] Querying Supabase for user:', userId)
    
    // Try multiple query strategies to find the user
    let user = null
    let error = null
    
    // Strategy 1: Query by id
    let result = await supabase
      .from('users')
      .select('id, email, name, username, image, bio, gender, favoriteArtists, favoriteSongs')
      .eq('id', userId)
      .maybeSingle()
    
    if (result.error) {
      console.error('[profile] Query by id failed:', result.error)
      error = result.error
    } else if (result.data) {
      user = result.data
      console.log('[profile] Found user by id:', user.username || user.email)
    }
    
    // Strategy 2: If not found, try by clerkId
    if (!user && clerkUserId) {
      console.log('[profile] Trying query by clerkId:', clerkUserId)
      result = await supabase
        .from('users')
        .select('id, email, name, username, image, bio, gender, favoriteArtists, favoriteSongs')
        .eq('clerkId', clerkUserId)
        .maybeSingle()
      
      if (result.error) {
        console.error('[profile] Query by clerkId failed:', result.error)
        if (!error) error = result.error
      } else if (result.data) {
        user = result.data
        console.log('[profile] Found user by clerkId:', user.username || user.email)
      }
    }
    
    // Strategy 3: If still not found, try by email
    if (!user) {
      const { currentUser } = await import('@clerk/nextjs/server')
      const clerkUser = await currentUser()
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress
      
      if (email) {
        console.log('[profile] Trying query by email:', email)
        result = await supabase
          .from('users')
          .select('id, email, name, username, image, bio, gender, favoriteArtists, favoriteSongs')
          .eq('email', email)
          .maybeSingle()
        
        if (result.error) {
          console.error('[profile] Query by email failed:', result.error)
          if (!error) error = result.error
        } else if (result.data) {
          user = result.data
          console.log('[profile] Found user by email:', user.username || user.email)
        }
      }
    }

    if (error && !user) {
      console.error('[profile] All query strategies failed. Last error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId,
        clerkUserId,
      })
      return NextResponse.json({ 
        error: 'Failed to fetch user from database', 
        message: error.message 
      }, { status: 500 })
    }

    if (!user) {
      console.error('[profile] User not found in database after all strategies:', { userId, clerkUserId })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('[profile] Successfully fetched user:', user.username || user.email)
    console.log('[profile] User image data:', {
      image: user.image,
      hasImage: !!user.image,
      imageLength: user.image?.length,
      imageType: typeof user.image,
    })

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
    if (data.gender !== undefined) updateData.gender = data.gender || null
    if (data.favoriteArtists !== undefined) updateData.favoriteArtists = JSON.stringify(data.favoriteArtists || [])
    if (data.favoriteSongs !== undefined) updateData.favoriteSongs = JSON.stringify(data.favoriteSongs || [])
    if (data.theme !== undefined) updateData.theme = data.theme

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, username, image, bio, gender, favoriteArtists, favoriteSongs')
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
