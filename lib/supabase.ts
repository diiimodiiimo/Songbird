import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase client for server-side usage
// This uses the REST API which works reliably on Vercel (no TCP connection needed)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create client with service role key for server-side operations
// This bypasses RLS and gives full access
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

// Helper to check if supabase is configured
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const missing = []
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    throw new Error(`Supabase not configured. Missing: ${missing.join(', ')}`)
  }
  return supabase
}

// Types for our database tables (snake_case to match Supabase)
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
