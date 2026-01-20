import type { ThemeId } from '@/lib/theme'

export interface AviaryUser {
  id: string
  username: string
  name: string | null
  avatarUrl?: string
  theme: ThemeId
}

export interface TaggedPerson {
  id: string
  name: string
  userId?: string | null
}

export interface AviarySong {
  id: string
  spotifyTrackId: string
  trackName: string
  artistName: string
  albumArtUrl: string
  taggedPeople: TaggedPerson[]
  createdAt: string
}

export interface SongAssociation {
  id: string
  songTitle: string
  artist: string
  albumTitle?: string | null
  albumArt?: string | null
  trackId?: string | null
  note?: string | null
  createdAt: string
}

export interface AviaryBird {
  user: AviaryUser
  latestSong: AviarySong | null
  isCurrentUser: boolean
}

export interface AviaryData {
  currentUser: AviaryBird
  friends: AviaryBird[]
}

