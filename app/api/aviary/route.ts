import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getFriendIds } from '@/lib/friends'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import type { AviaryData, AviaryBird } from '@/types/aviary'

// GET - Get aviary data (current user + friends with their latest songs)
export async function GET() {
  console.log('[aviary] Starting request')
  try {
    const { userId: clerkUserId } = await auth()
    console.log('[aviary] Clerk userId:', clerkUserId)
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    console.log('[aviary] Database userId:', userId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const supabase = getSupabase()

    // 1. Get current user with theme
    console.log('[aviary] Fetching user with id:', userId)
    const { data: currentUserData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, username, image, theme')
      .eq('id', userId)
      .maybeSingle()

    console.log('[aviary] User query result:', { 
      data: currentUserData ? 'found' : 'null', 
      error: userError?.message || userError?.code 
    })

    if (userError) {
      console.error('[aviary] Error fetching current user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user data', message: userError.message }, { status: 500 })
    }

    if (!currentUserData) {
      console.error('[aviary] User not found for id:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Get current user's latest song with mentioned users
    const { data: currentUserLatestSong } = await supabase
      .from('entries')
      .select('id, songTitle, artist, albumTitle, albumArt, trackId, createdAt, date')
      .eq('userId', userId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get mentioned users for current user's latest song (public mentions, not private notes)
    let currentUserMentions: { id: string; name: string; userId: string | null }[] = []
    if (currentUserLatestSong) {
      const { data: mentions } = await supabase
        .from('mentions')
        .select('id, userId')
        .eq('entryId', currentUserLatestSong.id)
      
      if (mentions && mentions.length > 0) {
        // Get usernames for the mentioned users
        const mentionUserIds = mentions.map(m => m.userId)
        const { data: mentionedUsers } = await supabase
          .from('users')
          .select('id, name, username')
          .in('id', mentionUserIds)
        
        currentUserMentions = mentions.map(m => {
          const user = mentionedUsers?.find(u => u.id === m.userId)
          return {
            id: m.id,
            name: user?.username || user?.name || 'Unknown',
            userId: m.userId,
          }
        })
      }
    }

    // 3. Get friend IDs
    const friendIds = await getFriendIds(userId)

    // Build current user bird
    const currentUserBird: AviaryBird = {
      user: {
        id: currentUserData.id,
        username: currentUserData.username || currentUserData.name || currentUserData.email.split('@')[0],
        name: currentUserData.name,
        avatarUrl: currentUserData.image && !currentUserData.image.startsWith('data:') ? currentUserData.image : undefined,
        theme: currentUserData.theme || 'american-robin',
      },
      latestSong: currentUserLatestSong ? {
        id: currentUserLatestSong.id,
        spotifyTrackId: currentUserLatestSong.trackId,
        trackName: currentUserLatestSong.songTitle,
        artistName: currentUserLatestSong.artist,
        albumArtUrl: currentUserLatestSong.albumArt,
        taggedPeople: currentUserMentions,
        createdAt: currentUserLatestSong.createdAt,
      } : null,
      isCurrentUser: true,
    }

    // If no friends, return just current user
    if (friendIds.length === 0) {
      const aviaryData: AviaryData = {
        currentUser: currentUserBird,
        friends: [],
      }
      return NextResponse.json(aviaryData)
    }

    // 4. Get friends' user info with theme
    const { data: friendsData } = await supabase
      .from('users')
      .select('id, email, name, username, image, theme')
      .in('id', friendIds)

    if (!friendsData || friendsData.length === 0) {
      const aviaryData: AviaryData = {
        currentUser: currentUserBird,
        friends: [],
      }
      return NextResponse.json(aviaryData)
    }

    // 5. Get latest songs for all friends with mentioned users
    const friendBirds: AviaryBird[] = await Promise.all(
      friendsData.map(async (friend) => {
        const { data: latestSong } = await supabase
          .from('entries')
          .select('id, songTitle, artist, albumTitle, albumArt, trackId, createdAt, date')
          .eq('userId', friend.id)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Get mentioned users for this entry (public mentions)
        let mentions: { id: string; name: string; userId: string | null }[] = []
        if (latestSong) {
          const { data: mentionData } = await supabase
            .from('mentions')
            .select('id, userId')
            .eq('entryId', latestSong.id)
          
          if (mentionData && mentionData.length > 0) {
            const mentionUserIds = mentionData.map(m => m.userId)
            const { data: mentionedUsers } = await supabase
              .from('users')
              .select('id, name, username')
              .in('id', mentionUserIds)
            
            mentions = mentionData.map(m => {
              const user = mentionedUsers?.find(u => u.id === m.userId)
              return {
                id: m.id,
                name: user?.username || user?.name || 'Unknown',
                userId: m.userId,
              }
            })
          }
        }

        return {
          user: {
            id: friend.id,
            username: friend.username || friend.name || friend.email.split('@')[0],
            name: friend.name,
            avatarUrl: friend.image && !friend.image.startsWith('data:') ? friend.image : undefined,
            theme: friend.theme || 'american-robin',
          },
          latestSong: latestSong ? {
            id: latestSong.id,
            spotifyTrackId: latestSong.trackId,
            trackName: latestSong.songTitle,
            artistName: latestSong.artist,
            albumArtUrl: latestSong.albumArt,
            taggedPeople: mentions,
            createdAt: latestSong.createdAt,
          } : null,
          isCurrentUser: false,
        }
      })
    )

    const aviaryData: AviaryData = {
      currentUser: currentUserBird,
      friends: friendBirds,
    }

    return NextResponse.json(aviaryData)
  } catch (error: any) {
    console.error('[aviary] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch aviary data', message: error?.message },
      { status: 500 }
    )
  }
}

