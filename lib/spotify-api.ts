/**
 * Server-side Spotify Web API helpers.
 *
 * Uses the Client Credentials flow with a module-level token cache —
 * tokens last 1 hour, so per-request token fetches are wasted round trips.
 * Cache persists for the lifetime of the serverless instance.
 */

interface CachedToken {
  value: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null

export async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value
  }

  const clientId = process.env.SPOTIPY_CLIENT_ID
  const clientSecret = process.env.SPOTIPY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials are not configured')
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Spotify token request failed: ${res.status}`)
  }

  const data = await res.json()
  cachedToken = {
    value: data.access_token,
    // Refresh 60s before actual expiry to avoid using a token mid-death
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return cachedToken.value
}

export interface SpotifyTrackResult {
  id: string
  name: string
  artist: string
  album: string
  albumArt: string
  durationMs: number
  explicit: boolean
  popularity: number
  releaseDate?: string
  uri: string
}

interface CachedSearch {
  tracks: SpotifyTrackResult[]
  expiresAt: number
}

// Search results rarely change minute-to-minute. Caching them server-side
// keeps typeahead traffic from hammering Spotify's rate limits
// (Development Mode limits are tight as of the Feb 2026 API changes).
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000
const SEARCH_CACHE_MAX_ENTRIES = 500
const searchCache = new Map<string, CachedSearch>()

export async function searchTracks(query: string, limit = 8): Promise<SpotifyTrackResult[]> {
  const cacheKey = `${query.toLowerCase().trim()}::${limit}`
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.tracks
  }

  const token = await getSpotifyToken()
  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit) })
  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    // Token may have been revoked early — drop cache so next call re-authenticates
    if (res.status === 401) cachedToken = null
    throw new Error(`Spotify search failed: ${res.status}`)
  }

  const data = await res.json()
  const tracks: SpotifyTrackResult[] = (data.tracks?.items || []).map((track: any) => ({
    id: track.id,
    name: track.name,
    artist: track.artists?.[0]?.name || 'Unknown',
    album: track.album?.name || '',
    albumArt: track.album?.images?.[0]?.url || '',
    durationMs: track.duration_ms,
    explicit: track.explicit,
    popularity: track.popularity,
    releaseDate: track.album?.release_date,
    uri: track.uri,
  }))

  if (searchCache.size >= SEARCH_CACHE_MAX_ENTRIES) {
    const oldestKey = searchCache.keys().next().value
    if (oldestKey !== undefined) searchCache.delete(oldestKey)
  }
  searchCache.set(cacheKey, { tracks, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS })

  return tracks
}
