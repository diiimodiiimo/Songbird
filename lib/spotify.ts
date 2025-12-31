/**
 * Helper functions for Spotify URLs
 */

/**
 * Convert Spotify URI to web URL
 * @param uri - Spotify URI (e.g., "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")
 * @returns Spotify web URL or null if invalid
 */
export function spotifyUriToUrl(uri: string): string | null {
  if (!uri) return null
  
  // Handle different URI formats
  if (uri.startsWith('spotify:')) {
    const parts = uri.split(':')
    if (parts.length >= 3) {
      const type = parts[1] // track, album, artist
      const id = parts[2]
      return `https://open.spotify.com/${type}/${id}`
    }
  }
  
  // If it's already a URL, return as is
  if (uri.startsWith('http')) {
    return uri
  }
  
  // If it's just an ID, assume it's a track
  if (uri.length > 0 && !uri.includes(':')) {
    return `https://open.spotify.com/track/${uri}`
  }
  
  return null
}

/**
 * Get Spotify track URL from trackId or uri
 */
export function getSpotifyTrackUrl(trackId?: string, uri?: string): string | null {
  if (uri) {
    const url = spotifyUriToUrl(uri)
    if (url) return url
  }
  
  if (trackId) {
    return `https://open.spotify.com/track/${trackId}`
  }
  
  return null
}

/**
 * Get Spotify artist search URL
 */
export function getSpotifyArtistUrl(artistName: string): string {
  const encoded = encodeURIComponent(artistName)
  return `https://open.spotify.com/search/${encoded}`
}


