import { getSupabase, DbUser, DbEntry, DbFriendRequest, DbNotification, DbPersonReference } from './supabase'

/**
 * Database helper functions using Supabase REST API
 */

// ============ USER FUNCTIONS ============

export async function getUserById(id: string): Promise<DbUser | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[db] getUserById error:', error)
    throw error
  }

  return data
}

export async function getUserByClerkId(clerkId: string): Promise<DbUser | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerkId', clerkId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[db] getUserByClerkId error:', error)
    throw error
  }

  return data
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[db] getUserByEmail error:', error)
    throw error
  }

  return data
}

export async function createUser(user: Partial<DbUser>): Promise<DbUser> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select()
    .single()

  if (error) {
    console.error('[db] createUser error:', error)
    throw error
  }

  return data
}

export async function updateUser(id: string, updates: Partial<DbUser>): Promise<DbUser> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[db] updateUser error:', error)
    throw error
  }

  return data
}

export async function findUserByIdOrClerkId(idOrClerkId: string): Promise<DbUser | null> {
  const supabase = getSupabase()

  // Try by id first
  let { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`id.eq.${idOrClerkId},clerkId.eq.${idOrClerkId}`)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[db] findUserByIdOrClerkId error:', error)
    throw error
  }

  return data
}

// ============ ENTRY FUNCTIONS ============

export async function getEntriesByUserId(
  userId: string,
  options?: { limit?: number; offset?: number; orderBy?: 'asc' | 'desc' }
): Promise<DbEntry[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('entries')
    .select('*')
    .eq('userId', userId)
    .order('date', { ascending: options?.orderBy === 'asc' })

  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 100) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('[db] getEntriesByUserId error:', error)
    throw error
  }

  return data || []
}

export async function getEntryByUserAndDate(userId: string, date: string): Promise<DbEntry | null> {
  const supabase = getSupabase()

  // Date should be YYYY-MM-DD format
  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('userId', userId)
    .gte('date', startOfDay)
    .lte('date', endOfDay)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[db] getEntryByUserAndDate error:', error)
    throw error
  }

  return data
}

export async function createEntry(entry: Partial<DbEntry>): Promise<DbEntry> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('entries')
    .insert(entry)
    .select()
    .single()

  if (error) {
    console.error('[db] createEntry error:', error)
    throw error
  }

  return data
}

export async function updateEntry(id: string, updates: Partial<DbEntry>): Promise<DbEntry> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('entries')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[db] updateEntry error:', error)
    throw error
  }

  return data
}

export async function deleteEntry(id: string): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[db] deleteEntry error:', error)
    throw error
  }
}

export async function countEntriesByUserId(userId: string): Promise<number> {
  const supabase = getSupabase()

  const { count, error } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId)

  if (error) {
    console.error('[db] countEntriesByUserId error:', error)
    throw error
  }

  return count || 0
}

// ============ FRIEND FUNCTIONS ============

export async function getFriendsByUserId(userId: string): Promise<DbUser[]> {
  const supabase = getSupabase()

  // Get accepted friend requests where user is sender or receiver
  const { data: requests, error } = await supabase
    .from('friend_requests')
    .select('senderId, receiverId')
    .eq('status', 'accepted')
    .or(`senderId.eq.${userId},receiverId.eq.${userId}`)

  if (error) {
    console.error('[db] getFriendsByUserId error:', error)
    throw error
  }

  if (!requests || requests.length === 0) return []

  // Get the friend IDs (the other person in each request)
  const friendIds = requests.map(r => r.senderId === userId ? r.receiverId : r.senderId)

  // Fetch the friend users
  const { data: friends, error: friendsError } = await supabase
    .from('users')
    .select('*')
    .in('id', friendIds)

  if (friendsError) {
    console.error('[db] getFriendsByUserId (friends) error:', friendsError)
    throw friendsError
  }

  return friends || []
}

export async function getFriendRequests(userId: string, status?: string): Promise<(DbFriendRequest & { sender: DbUser; receiver: DbUser })[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('friend_requests')
    .select(`
      *,
      sender:users!friend_requests_senderId_fkey(*),
      receiver:users!friend_requests_receiverId_fkey(*)
    `)
    .or(`senderId.eq.${userId},receiverId.eq.${userId}`)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('[db] getFriendRequests error:', error)
    throw error
  }

  return data || []
}

// ============ NOTIFICATION FUNCTIONS ============

export async function getNotificationsByUserId(userId: string, limit = 20): Promise<DbNotification[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[db] getNotificationsByUserId error:', error)
    throw error
  }

  return data || []
}

export async function markNotificationsRead(userId: string): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('userId', userId)
    .eq('read', false)

  if (error) {
    console.error('[db] markNotificationsRead error:', error)
    throw error
  }
}

// ============ PERSON REFERENCE FUNCTIONS ============

export async function getPersonReferencesByEntryId(entryId: string): Promise<DbPersonReference[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('person_references')
    .select('*')
    .eq('entryId', entryId)

  if (error) {
    console.error('[db] getPersonReferencesByEntryId error:', error)
    throw error
  }

  return data || []
}

// ============ UTILITY FUNCTIONS ============

export async function testConnection(): Promise<{ success: boolean; message: string; userCount?: number }> {
  try {
    const supabase = getSupabase()

    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return { success: false, message: error.message }
    }

    return { success: true, message: 'Connected successfully', userCount: count || 0 }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Unknown error' }
  }
}
