import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * 30-second song previews via the iTunes Search API.
 *
 * iTunes knows nothing about Spotify track IDs, so matching is textual —
 * scored against title, artist, album, and track duration. A wrong preview is
 * worse than none, so results below the confidence threshold return null.
 *
 * Results are cached aggressively (iTunes limits ~20 req/min/IP and a song's
 * preview URL doesn't change).
 */

interface CachedPreview {
  previewUrl: string | null
  expiresAt: number
}

const PREVIEW_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const PREVIEW_CACHE_MAX = 2000
const previewCache = new Map<string, CachedPreview>()

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '') // (feat. X), [Remastered]
    .replace(/\b(feat|ft|featuring)\.?\s.*$/, '')
    .replace(/[.,'"!?&:;\-–—()[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreResult(
  r: any,
  title: string,
  artist: string,
  album: string | null,
  durationMs: number | null
): number {
  const rTitle = normalize(r.trackName || '')
  const rArtist = normalize(r.artistName || '')
  const rAlbum = normalize(r.collectionName || '')

  let titleScore = 0
  if (rTitle === title) titleScore = 4
  else if (rTitle.includes(title) || title.includes(rTitle)) titleScore = 2

  let artistScore = 0
  if (rArtist === artist) artistScore = 4
  else if (rArtist.includes(artist) || artist.includes(rArtist)) artistScore = 2

  // Title and artist must both plausibly match — otherwise it's a different song
  if (titleScore === 0 || artistScore === 0) return 0

  let score = titleScore + artistScore
  if (album && rAlbum && (rAlbum === album || rAlbum.includes(album) || album.includes(rAlbum))) {
    score += 2
  }
  if (durationMs && r.trackTimeMillis) {
    const diff = Math.abs(r.trackTimeMillis - durationMs)
    if (diff < 4000) score += 3
    else if (diff < 10000) score += 1
    else if (diff > 30000) score -= 2 // very different length — probably a live/extended cut
  }
  return score
}

const MIN_CONFIDENCE = 6

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // READ (not SEARCH): cards eagerly check availability, and responses are
    // served from cache almost always
    const rateLimitResult = await checkRateLimit(userId, 'READ')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const { searchParams } = new URL(request.url)
    const titleParam = searchParams.get('title')
    const artistParam = searchParams.get('artist')
    if (!titleParam || !artistParam) {
      return NextResponse.json({ error: 'title and artist are required' }, { status: 400 })
    }
    const albumParam = searchParams.get('album')
    const durationParam = searchParams.get('durationMs')
    const durationMs = durationParam ? parseInt(durationParam, 10) || null : null

    const title = normalize(titleParam)
    const artist = normalize(artistParam)
    const album = albumParam ? normalize(albumParam) : null

    const cacheKey = `${title}::${artist}::${album || ''}::${durationMs || ''}`
    const cached = previewCache.get(cacheKey)
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json({ previewUrl: cached.previewUrl })
    }

    const params = new URLSearchParams({
      term: `${titleParam} ${artistParam}`,
      media: 'music',
      entity: 'song',
      limit: '10',
    })
    const res = await fetch(`https://itunes.apple.com/search?${params}`, {
      headers: { 'User-Agent': 'SongBird/1.0' },
    })

    let previewUrl: string | null = null
    if (res.ok) {
      const data = await res.json()
      const results: any[] = (data.results || []).filter((r: any) => r.previewUrl)
      let best: any = null
      let bestScore = 0
      for (const r of results) {
        const score = scoreResult(r, title, artist, album, durationMs)
        if (score > bestScore) {
          best = r
          bestScore = score
        }
      }
      if (best && bestScore >= MIN_CONFIDENCE) {
        previewUrl = best.previewUrl
      }
    }

    if (previewCache.size >= PREVIEW_CACHE_MAX) {
      const oldestKey = previewCache.keys().next().value
      if (oldestKey !== undefined) previewCache.delete(oldestKey)
    }
    previewCache.set(cacheKey, { previewUrl, expiresAt: Date.now() + PREVIEW_CACHE_TTL_MS })

    return NextResponse.json({ previewUrl })
  } catch (error) {
    console.error('[songs/preview] Error:', error)
    return NextResponse.json({ previewUrl: null })
  }
}
