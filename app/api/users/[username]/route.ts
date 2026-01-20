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
    const supabase = getSupabase()

    // Find user by username or email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, name, email, image, bio, favoriteArtists, favoriteSongs')
      .or(`username.eq.${username},email.eq.${username}`)
      .maybeSingle()

    if (error) throw error

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
