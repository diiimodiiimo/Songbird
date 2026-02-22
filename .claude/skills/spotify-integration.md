# /spotify-integration

Help with Spotify Web API integration - search, authentication, and API compliance.

## Overview

SongBird uses Spotify Web API for:
- Song search (main feature)
- Track metadata (title, artist, album art)
- Audio previews (30-second clips)

## Key Files

- `lib/spotify.ts` - Spotify client and token management
- `app/api/songs/route.ts` - Song search API
- `components/SpotifyAttribution.tsx` - Required attribution

## Authentication Flow

SongBird uses **Client Credentials** flow (app-level, not user-level):

```typescript
// lib/spotify.ts
export async function getSpotifyToken(): Promise<string> {
  // Check cached token
  if (tokenCache.token && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token
  }

  // Request new token
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json()
  
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000) - 60000, // Refresh 1min early
  }

  return tokenCache.token
}
```

## Song Search

```typescript
export async function searchTracks(query: string, limit = 20) {
  const token = await getSpotifyToken()
  
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  )

  const data = await response.json()
  return data.tracks.items.map(formatTrack)
}
```

## Track Data Format

```typescript
interface SpotifyTrack {
  id: string              // Spotify track ID
  name: string            // Song title
  artists: Artist[]       // Array of artists
  album: {
    name: string          // Album title
    images: Image[]       // Album art (multiple sizes)
    release_date: string  // Release date
  }
  duration_ms: number     // Duration in milliseconds
  explicit: boolean       // Explicit content flag
  popularity: number      // 0-100 popularity score
  preview_url: string     // 30-second preview (may be null)
  uri: string             // Spotify URI (spotify:track:xxx)
  external_urls: {
    spotify: string       // Web URL to track
  }
}
```

## Environment Variables

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

## API Compliance (IMPORTANT!)

### Attribution Requirement
Spotify requires visible "Powered by Spotify" attribution on pages displaying their data.

```tsx
import SpotifyAttribution from '@/components/SpotifyAttribution'

// Include on pages showing song data
<SpotifyAttribution />  // Full version
<SpotifyAttribution variant="minimal" />  // Compact version
```

### Rate Limits
- Client Credentials: ~180 requests/minute per app
- SongBird implements rate limiting to stay well under

### Linking Requirements
- Links to Spotify content must use `target="_blank"`
- Should include Spotify logo/branding near links

```tsx
<a 
  href={`https://open.spotify.com/track/${trackId}`}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2"
>
  <SpotifyIcon /> Listen on Spotify
</a>
```

### Data Storage
- **DO**: Store track IDs, URIs, basic metadata
- **DO**: Cache album art URLs (they're CDN links)
- **DON'T**: Store audio files or full catalog data
- **DON'T**: Use Spotify data to train ML models

## Preview Playback

```typescript
// Check if preview is available
if (track.preview_url) {
  const audio = new Audio(track.preview_url)
  audio.play()
}

// Note: ~20% of tracks don't have previews
```

## Common Issues

### "Token expired"
- Token cache not refreshing properly
- Check `expiresAt` calculation

### "No results"
- Query too specific
- Check encoding (`encodeURIComponent`)

### "Preview not playing"
- `preview_url` is null for some tracks
- Check browser autoplay policy

### "Rate limited"
- Too many requests
- Implement backoff and caching

## Testing

Use Spotify's test credentials for development:
- Search for popular songs to test
- Test with special characters in queries
- Test preview playback on mobile

## Links

- [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api)
- [API Terms of Service](https://developer.spotify.com/terms)
- [Rate Limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits)



