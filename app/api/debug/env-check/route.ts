import { NextResponse } from 'next/server'

// Debug endpoint to check if environment variables are loaded
// DELETE THIS FILE after debugging!
export async function GET() {
  return NextResponse.json({
    hasSpotifyClientId: !!process.env.SPOTIPY_CLIENT_ID,
    hasSpotifyClientSecret: !!process.env.SPOTIPY_CLIENT_SECRET,
    spotifyClientIdPrefix: process.env.SPOTIPY_CLIENT_ID?.substring(0, 8) + '...' || 'NOT SET',
    spotifyClientSecretPrefix: process.env.SPOTIPY_CLIENT_SECRET?.substring(0, 4) + '...' || 'NOT SET',
    // Show all env var names that contain SPOT or SPOTIFY
    spotifyEnvVars: Object.keys(process.env).filter(k => k.includes('SPOT') || k.includes('SPOTIFY')),
    nodeEnv: process.env.NODE_ENV,
  })
}







