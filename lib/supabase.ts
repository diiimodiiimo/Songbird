import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization - client is created on first use, not at module load
let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_supabase) {
    return _supabase
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  _supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _supabase
}

// For backwards compatibility - but prefer getSupabase()
export const supabase = null as SupabaseClient | null

// Types for our database tables
export interface DbUser {
  id: string
  email: string
  name: string | null
  username: string | null
  password: string | null
  clerkId: string | null
  image: string | null
  bio: string | null
  favoriteArtists: string | null
  favoriteSongs: string | null
  theme: string
  createdAt: string
  updatedAt: string
}

export interface DbEntry {
  id: string
  date: string
  userId: string
  songTitle: string
  artist: string
  albumTitle: string
  albumArt: string
  durationMs: number
  explicit: boolean
  popularity: number
  releaseDate: string | null
  trackId: string
  uri: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface DbFriendRequest {
  id: string
  senderId: string
  receiverId: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface DbNotification {
  id: string
  userId: string
  type: string
  relatedId: string | null
  read: boolean
  createdAt: string
}

export interface DbPersonReference {
  id: string
  entryId: string
  name: string
  userId: string | null
  source: string | null
  createdAt: string
}
