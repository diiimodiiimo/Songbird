import { getSupabase } from './supabase'

// In-memory cache for clerk-to-database user ID mapping
const userIdCache = new Map<string, { id: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function generateCuid(): string {
  // Simple cuid-like generator
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

/**
 * Generate a unique invite code
 * Format: 8-character alphanumeric code
 */
function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Get the database user ID from Clerk user ID
 * 
 * IMPORTANT: This function ALWAYS returns users.id (the database primary key)
 * - For new users: users.id = clerkUserId (same value)
 * - For existing users: users.id may differ from clerkId
 * 
 * This ID should be used for all database queries (entries.userId, etc.)
 * Uses Supabase REST API for reliable serverless database access.
 * 
 * @param clerkUserId - The Clerk user ID (from auth().userId)
 * @returns The database users.id field, or null if user not found/can't be created
 */
export async function getUserIdFromClerk(clerkUserId: string): Promise<string | null> {
  if (!clerkUserId) {
    console.log('[clerk-sync] No clerkUserId provided')
    return null
  }

  // Check cache first
  const cached = userIdCache.get(clerkUserId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[clerk-sync] Cache hit for:', clerkUserId)
    return cached.id
  }

  const supabase = getSupabase()

  try {
    console.log('[clerk-sync] Looking up user:', clerkUserId)

    // Try to find user by id or clerkId
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .or(`id.eq.${clerkUserId},clerkId.eq.${clerkUserId}`)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[clerk-sync] Supabase error:', error)
      throw error
    }

    if (user) {
      console.log('[clerk-sync] Found user by id/clerkId:', user.id)
      userIdCache.set(clerkUserId, { id: user.id, timestamp: Date.now() })
      return user.id
    }

    console.log('[clerk-sync] User not found by id/clerkId, trying email lookup')

    // If not found, get email from Clerk and look up by email
    const { currentUser } = await import('@clerk/nextjs/server')
    const clerkUser = await currentUser()

    if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
      const email = clerkUser.emailAddresses[0].emailAddress
      console.log('[clerk-sync] Looking up by email:', email)

      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('id, username, image')
        .eq('email', email)
        .maybeSingle()

      if (emailError) {
        console.error('[clerk-sync] Email lookup error:', emailError)
        throw emailError
      }

      if (userByEmail) {
        console.log('[clerk-sync] Found user by email:', userByEmail.id)

        // Sync Clerk data to database user - ONLY if database doesn't have it
        const updateData: Record<string, any> = {
          clerkId: clerkUserId,
        }
        
        // Update name if Clerk has it (name can be updated)
        if (clerkUser.firstName) {
          const clerkName = `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
          updateData.name = clerkName
        }
        
        // ONLY update username if database doesn't have one (don't overwrite custom usernames!)
        if (!userByEmail.username && clerkUser.username) {
          updateData.username = clerkUser.username
        }
        
        // ONLY update image if database doesn't have one (don't overwrite custom images!)
        if (!userByEmail.image && clerkUser.imageUrl) {
          updateData.image = clerkUser.imageUrl
        }
        
        updateData.updatedAt = new Date().toISOString()

        // Link clerkId and sync data for future lookups
        await supabase
          .from('users')
          .update(updateData)
          .eq('id', userByEmail.id)

        userIdCache.set(clerkUserId, { id: userByEmail.id, timestamp: Date.now() })
        return userByEmail.id
      }

      // User doesn't exist - create them
      console.log('[clerk-sync] User not found, creating new user for:', email)

      const newUserId = clerkUserId // Use Clerk ID as database ID
      const inviteCode = generateInviteCode()
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          email,
          name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
            : email.split('@')[0],
          username: clerkUser.username || null,
          image: clerkUser.imageUrl || null,
          clerkId: clerkUserId,
          password: '',
          inviteCode, // Generate unique invite code for new users
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (createError) {
        // Handle unique constraint - user might have been created concurrently
        if (createError.code === '23505') {
          console.log('[clerk-sync] User already exists, retrying lookup')
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`id.eq.${clerkUserId},email.eq.${email}`)
            .limit(1)
            .maybeSingle()

          if (existingUser) {
            userIdCache.set(clerkUserId, { id: existingUser.id, timestamp: Date.now() })
            return existingUser.id
          }
        }
        console.error('[clerk-sync] Create user error:', createError)
        throw createError
      }

      console.log('[clerk-sync] Created new user:', newUser.id)
      userIdCache.set(clerkUserId, { id: newUser.id, timestamp: Date.now() })
      return newUser.id
    }

    console.log('[clerk-sync] No email found for Clerk user')
    return null
  } catch (error: any) {
    console.error('[clerk-sync] Error:', error?.message || error)
    throw error
  }
}

/**
 * Helper to get database user ID from Clerk auth
 */
export async function getUserId(): Promise<string | null> {
  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  if (!userId) return null
  return await getUserIdFromClerk(userId)
}


/**
 * Get or create a full user object from Clerk ID
 * Returns the database user with common fields
 */
export async function getOrCreateUser(clerkUserId: string): Promise<{
  id: string
  email: string
  name: string | null
  username: string | null
  image: string | null
  inviteCode: string | null
} | null> {
  if (!clerkUserId) return null

  const supabase = getSupabase()

  // First try to get existing user
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, name, username, image, inviteCode')
    .or(`id.eq.${clerkUserId},clerkId.eq.${clerkUserId}`)
    .limit(1)
    .maybeSingle()

  if (existingUser) {
    return existingUser
  }

  // Get Clerk user info to create new user
  const { currentUser } = await import('@clerk/nextjs/server')
  const clerkUser = await currentUser()

  if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
    return null
  }

  const email = clerkUser.emailAddresses[0].emailAddress

  // Check by email
  const { data: userByEmail } = await supabase
    .from('users')
    .select('id, email, name, username, image, inviteCode')
    .eq('email', email)
    .maybeSingle()

  if (userByEmail) {
    // Link clerkId for future lookups
    await supabase
      .from('users')
      .update({ clerkId: clerkUserId })
      .eq('id', userByEmail.id)
    return userByEmail
  }

  // Create new user
  const newUserId = clerkUserId
  const inviteCode = generateInviteCode()
  
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      id: newUserId,
      email,
      name: clerkUser.firstName
        ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
        : email.split('@')[0],
      username: clerkUser.username || null,
      image: clerkUser.imageUrl || null,
      clerkId: clerkUserId,
      password: '',
      inviteCode, // Generate unique invite code for new users
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select('id, email, name, username, image, inviteCode')
    .single()

  if (createError) {
    // Handle unique constraint - retry lookup
    if (createError.code === '23505') {
      const { data: retryUser } = await supabase
        .from('users')
        .select('id, email, name, username, image, inviteCode')
        .or(`id.eq.${clerkUserId},email.eq.${email}`)
        .limit(1)
        .maybeSingle()
      return retryUser
    }
    console.error('[clerk-sync] Create user error:', createError)
    return null
  }

  return newUser
}
