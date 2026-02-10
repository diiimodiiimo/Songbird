import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // Require authentication to view user profiles
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = await params
    const decodedUsername = decodeURIComponent(username)
    const supabase = getSupabase()

    // Find user by username or email or ID
    // Handle cases where username might be null/undefined or the param might be an email or ID
    let user = null
    
    // Try username first (if it's not null/undefined)
    if (decodedUsername && decodedUsername !== 'null' && decodedUsername !== 'undefined') {
      const { data: userByUsername, error: usernameError } = await supabase
        .from('users')
        .select('id, username, name, email, image, bio, favoriteArtists, favoriteSongs')
        .eq('username', decodedUsername)
        .maybeSingle()
      
      if (usernameError) throw usernameError
      user = userByUsername
    }
    
    // If not found by username, try email
    if (!user && decodedUsername && decodedUsername.includes('@')) {
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('id, username, name, email, image, bio, favoriteArtists, favoriteSongs')
        .eq('email', decodedUsername)
        .maybeSingle()
      
      if (emailError) throw emailError
      user = userByEmail
    }
    
    // If still not found, try by ID (fallback)
    if (!user && decodedUsername) {
      const { data: userById, error: idError } = await supabase
        .from('users')
        .select('id, username, name, email, image, bio, favoriteArtists, favoriteSongs')
        .eq('id', decodedUsername)
        .maybeSingle()
      
      if (idError) throw idError
      user = userById
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Count entries
    const { count: entriesCount } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('userId', user.id)

    // Count friends
    const { count: friendsCount } = await supabase
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`senderId.eq.${user.id},receiverId.eq.${user.id}`)

    // Parse favorite artists and songs
    let favoriteArtists: string[] = []
    let favoriteSongs: Array<{ songTitle: string; artist: string }> = []

    if (user.favoriteArtists) {
      try {
        favoriteArtists = typeof user.favoriteArtists === 'string' 
          ? JSON.parse(user.favoriteArtists) 
          : user.favoriteArtists
      } catch {
        favoriteArtists = []
      }
    }

    if (user.favoriteSongs) {
      try {
        favoriteSongs = typeof user.favoriteSongs === 'string'
          ? JSON.parse(user.favoriteSongs)
          : user.favoriteSongs
      } catch {
        favoriteSongs = []
      }
    }

    return NextResponse.json({
      username: user.username || user.email?.split('@')[0],
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      favoriteArtists,
      favoriteSongs,
      stats: {
        totalEntries: entriesCount || 0,
        friendsCount: friendsCount || 0,
      },
    })
  } catch (error: any) {
    console.error('[users/[username]] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch profile', message: error?.message },
      { status: 500 }
    )
  }
}
