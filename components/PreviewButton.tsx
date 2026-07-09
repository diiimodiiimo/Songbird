'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'

/**
 * Play/pause control for 30-second song previews (iTunes).
 *
 * Availability is checked eagerly (through our cached /api/songs/preview),
 * and nothing renders at all when a song has no preview. Two looks:
 *  - default: a round play/pause button
 *  - birdImage set: a bird perched above the control that "sings" (bounces
 *    with floating notes) while the preview plays
 *
 * One module-level audio element guarantees a single preview plays at a
 * time; stopActivePreview() lets the app stop playback on tab changes.
 */

let sharedAudio: HTMLAudioElement | null = null
let activeStop: (() => void) | null = null

function getAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio()
    sharedAudio.preload = 'none'
  }
  return sharedAudio
}

/** Stop whatever preview is currently playing (used on tab switches). */
export function stopActivePreview() {
  if (sharedAudio) sharedAudio.pause()
  if (activeStop) {
    activeStop()
    activeStop = null
  }
}

const PlayIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.54-6.86a1.05 1.05 0 0 0 0-1.76L9.56 4.26A1.04 1.04 0 0 0 8 5.14z" />
  </svg>
)

const PauseIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
)

export default function PreviewButton({
  songTitle,
  artist,
  album,
  durationMs,
  birdImage,
  birdSize = 40,
  className = '',
}: {
  songTitle: string
  artist: string
  album?: string
  durationMs?: number
  birdImage?: string
  birdSize?: number
  className?: string
}) {
  const [playing, setPlaying] = useState(false)

  // Eager availability check — heavily cached server-side and client-side,
  // so scrolling the same feed twice costs nothing.
  const { data: previewUrl } = useQuery({
    queryKey: ['song-preview', songTitle.toLowerCase(), artist.toLowerCase()],
    queryFn: async () => {
      const params = new URLSearchParams({ title: songTitle, artist })
      if (album) params.set('album', album)
      if (durationMs) params.set('durationMs', String(durationMs))
      const res = await fetch(`/api/songs/preview?${params}`)
      if (!res.ok) return null
      const data = await res.json()
      return (data.previewUrl as string) || null
    },
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  })

  // Stop audio if this button unmounts mid-play
  useEffect(() => {
    return () => {
      if (playing) stopActivePreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // No preview (or still checking) → render nothing at all
  if (!previewUrl) return null

  const stop = () => {
    getAudio().pause()
    activeStop = null
    setPlaying(false)
  }

  const play = async () => {
    stopActivePreview() // stop any other card first

    const audio = getAudio()
    audio.src = previewUrl
    audio.currentTime = 0
    try {
      await audio.play()
    } catch {
      return
    }
    setPlaying(true)
    activeStop = () => setPlaying(false)
    audio.onended = () => {
      activeStop = null
      setPlaying(false)
    }
  }

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (playing) stop()
    else play()
  }

  if (birdImage) {
    const badge = Math.max(18, Math.round(birdSize * 0.3))
    return (
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause preview' : 'Play 30-second preview'}
        title={playing ? 'Pause' : 'Hear a 30-second preview'}
        className={`relative flex items-end justify-center group ${className}`}
        style={{ width: birdSize + 8, height: birdSize + 8 }}
      >
        {/* floating notes while singing */}
        {playing && (
          <span aria-hidden="true">
            <span className="absolute -top-2 left-0 text-accent animate-bounce" style={{ fontSize: Math.max(12, birdSize * 0.22), animationDuration: '0.9s' }}>♪</span>
            <span className="absolute -top-3 right-0 text-accent animate-bounce" style={{ fontSize: Math.max(14, birdSize * 0.28), animationDuration: '1.2s', animationDelay: '0.3s' }}>♫</span>
          </span>
        )}
        <Image
          src={birdImage}
          alt=""
          width={birdSize}
          height={birdSize}
          className={`object-contain transition-transform ${playing ? 'animate-bounce' : 'group-hover:scale-110'}`}
          style={playing ? { animationDuration: '0.7s' } : undefined}
        />
        {/* play/pause badge at the bird's feet */}
        <span
          className={`absolute bottom-0 right-0 flex items-center justify-center rounded-full border ${
            playing ? 'bg-accent text-bg border-accent' : 'bg-surface text-text/80 border-text/20'
          }`}
          style={{ width: badge, height: badge }}
        >
          {playing ? <PauseIcon size={Math.round(badge * 0.55)} /> : <PlayIcon size={Math.round(badge * 0.55)} />}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      aria-label={playing ? 'Pause preview' : 'Play 30-second preview'}
      title={playing ? 'Pause' : 'Play a 30-second preview'}
      className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
        playing
          ? 'bg-accent text-bg'
          : 'bg-surface text-text/70 hover:text-accent hover:bg-accent/10'
      } ${className}`}
    >
      {playing ? <PauseIcon /> : <PlayIcon />}
    </button>
  )
}
