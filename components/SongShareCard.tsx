'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useTheme, getBirdLogo } from '@/lib/theme'

interface SongShareCardProps {
  songTitle: string
  artist: string
  albumArt: string
  albumTitle?: string
  date: string
  username: string
  onClose: () => void
}

const INSIGHTS = [
  "this one just hit different today",
  "the soundtrack to my whole mood rn",
  "on repeat. no skip. ever.",
  "when a song just *gets* you",
  "found the sound I didn't know I needed",
  "this is the one. that's it. that's the post.",
  "main character energy in a song",
  "if today had a theme song, this is it",
  "couldn't stop thinking about this one",
  "vibes: immaculate",
  "this song understood the assignment",
  "living in this sound today",
  "my brain has been playing this all day",
  "just gonna leave this here",
  "the one song that made today make sense",
]

function getInsight(songTitle: string, date: string): string {
  const hash = songTitle.length + date.charCodeAt(date.length - 1)
  return INSIGHTS[hash % INSIGHTS.length]
}

function getDayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('T')[0].split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)

  if (d.getTime() === today.getTime()) return "today's"
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.getTime() === yesterday.getTime()) return "yesterday's"
  
  return d.toLocaleDateString('en-US', { weekday: 'long' }) + "'s"
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('T')[0].split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, maxWidth: number, lineHeight: number
): number {
  const words = text.split(' ')
  let line = ''
  let lines = 0
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight)
      line = word
      lines++
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, y + lines * lineHeight)
  return lines + 1
}

export default function SongShareCard({
  songTitle,
  artist,
  albumArt,
  albumTitle,
  date,
  username,
  onClose,
}: SongShareCardProps) {
  const [downloading, setDownloading] = useState(false)
  const { currentTheme } = useTheme()
  const birdLogo = getBirdLogo(currentTheme.id)
  const insight = getInsight(songTitle, date)
  const dayLabel = getDayLabel(date)
  const accentColor = currentTheme.colors.accent
  const primaryColor = currentTheme.colors.primary

  const generateImage = useCallback(async () => {
    setDownloading(true)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const W = 1080
      const H = 1920
      canvas.width = W
      canvas.height = H

      // Load album art
      const albumImg = new window.Image()
      albumImg.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        albumImg.onload = () => resolve()
        albumImg.onerror = () => reject(new Error('Failed to load album art'))
        albumImg.src = albumArt
      })

      // Load bird logo
      const birdImg = new window.Image()
      birdImg.crossOrigin = 'anonymous'
      await new Promise<void>((resolve) => {
        birdImg.onload = () => resolve()
        birdImg.onerror = () => resolve() // Don't fail if bird doesn't load
        birdImg.src = birdLogo
      })

      // Sample dominant colors from album art
      const sc = document.createElement('canvas')
      const sctx = sc.getContext('2d')!
      sc.width = albumImg.width
      sc.height = albumImg.height
      sctx.drawImage(albumImg, 0, 0)
      
      // Sample multiple points for richer colors
      const samples = [
        sctx.getImageData(0, 0, 1, 1).data,
        sctx.getImageData(albumImg.width - 1, 0, 1, 1).data,
        sctx.getImageData(Math.floor(albumImg.width / 2), Math.floor(albumImg.height / 2), 1, 1).data,
        sctx.getImageData(0, albumImg.height - 1, 1, 1).data,
        sctx.getImageData(albumImg.width - 1, albumImg.height - 1, 1, 1).data,
      ]
      
      // Pick the most saturated sample for the accent
      let bestSample = samples[0]
      let bestSat = 0
      for (const s of samples) {
        const max = Math.max(s[0], s[1], s[2])
        const min = Math.min(s[0], s[1], s[2])
        const sat = max === 0 ? 0 : (max - min) / max
        if (sat > bestSat) { bestSat = sat; bestSample = s }
      }

      const accentR = bestSample[0]
      const accentG = bestSample[1]
      const accentB = bestSample[2]

      // === BACKGROUND ===
      // Rich gradient using album colors
      const bg = ctx.createLinearGradient(0, 0, W * 0.3, H)
      bg.addColorStop(0, `rgb(${Math.floor(accentR * 0.15)}, ${Math.floor(accentG * 0.15)}, ${Math.floor(accentB * 0.15)})`)
      bg.addColorStop(0.3, '#0a0a0f')
      bg.addColorStop(0.7, '#0a0a0f')
      bg.addColorStop(1, `rgb(${Math.floor(accentR * 0.1)}, ${Math.floor(accentG * 0.1)}, ${Math.floor(accentB * 0.1)})`)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Ambient glow behind album art area
      const glowGrad = ctx.createRadialGradient(W / 2, 700, 100, W / 2, 700, 600)
      glowGrad.addColorStop(0, `rgba(${accentR}, ${accentG}, ${accentB}, 0.15)`)
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glowGrad
      ctx.fillRect(0, 0, W, H)

      // === TOP SECTION: Bird + "my song of the day" ===
      // Bird logo
      if (birdImg.complete && birdImg.naturalWidth > 0) {
        const birdSize = 120
        ctx.drawImage(birdImg, (W - birdSize) / 2, 100, birdSize, birdSize)
      }

      // "my song of the day" header
      ctx.textAlign = 'center'
      ctx.fillStyle = `rgba(${accentR}, ${accentG}, ${accentB}, 0.9)`
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.letterSpacing = '4px'
      ctx.fillText(`${dayLabel.toUpperCase()} SONG OF THE DAY`, W / 2, 280)
      ctx.letterSpacing = '0px'

      // Thin accent line under header
      ctx.strokeStyle = `rgba(${accentR}, ${accentG}, ${accentB}, 0.4)`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(W / 2 - 180, 300)
      ctx.lineTo(W / 2 + 180, 300)
      ctx.stroke()

      // === ALBUM ART ===
      const artSize = 640
      const artX = (W - artSize) / 2
      const artY = 360

      // Glow behind art
      ctx.shadowColor = `rgba(${accentR}, ${accentG}, ${accentB}, 0.5)`
      ctx.shadowBlur = 80
      ctx.shadowOffsetY = 0

      // Art background for shadow
      roundedRect(ctx, artX, artY, artSize, artSize, 28)
      ctx.fillStyle = '#000'
      ctx.fill()

      // Reset shadow before clipping
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0

      // Draw album art clipped to rounded rect
      ctx.save()
      roundedRect(ctx, artX, artY, artSize, artSize, 28)
      ctx.clip()
      ctx.drawImage(albumImg, artX, artY, artSize, artSize)
      ctx.restore()

      // Thin border on art
      roundedRect(ctx, artX, artY, artSize, artSize, 28)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 2
      ctx.stroke()

      // === SONG INFO ===
      const infoY = artY + artSize + 70

      // Song title (bold, large, white)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.textAlign = 'center'
      const titleLines = wrapText(ctx, songTitle, W / 2, infoY, W - 160, 68)

      // Artist
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.font = '38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      const artistY = infoY + titleLines * 68 + 15
      ctx.fillText(artist, W / 2, artistY)

      // === INSIGHT QUOTE ===
      const insightY = artistY + 80

      // Quote background pill
      const insightText = `"${insight}"`
      ctx.font = 'italic 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      const textW = ctx.measureText(insightText).width
      const pillW = Math.min(textW + 60, W - 120)
      const pillH = 56
      const pillX = (W - pillW) / 2
      
      roundedRect(ctx, pillX, insightY - 36, pillW, pillH, pillH / 2)
      ctx.fillStyle = `rgba(${accentR}, ${accentG}, ${accentB}, 0.12)`
      ctx.fill()
      roundedRect(ctx, pillX, insightY - 36, pillW, pillH, pillH / 2)
      ctx.strokeStyle = `rgba(${accentR}, ${accentG}, ${accentB}, 0.25)`
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = `rgba(${Math.min(accentR + 60, 255)}, ${Math.min(accentG + 60, 255)}, ${Math.min(accentB + 60, 255)}, 0.85)`
      ctx.font = 'italic 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(insightText, W / 2, insightY)

      // === BOTTOM SECTION ===
      // Date
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(formatDate(date), W / 2, H - 200)

      // Username
      ctx.fillStyle = `rgba(${accentR}, ${accentG}, ${accentB}, 0.7)`
      ctx.font = '600 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(`@${username}`, W / 2, H - 155)

      // SongBird branding bar at very bottom
      roundedRect(ctx, W / 2 - 130, H - 100, 260, 44, 22)
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fill()

      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText('🐦  SongBird', W / 2, H - 72)

      // === EXPORT ===
      const link = document.createElement('a')
      link.download = `songbird-${songTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      if (navigator.share && navigator.canShare) {
        try {
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png')
          })
          const file = new File([blob], `songbird-${songTitle}.png`, { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${songTitle} by ${artist}`,
              text: `My Song of the Day on SongBird`,
            })
          }
        } catch {
          // Sharing cancelled or failed, download already happened
        }
      }
    } catch (error) {
      console.error('Error generating song card:', error)
    } finally {
      setDownloading(false)
    }
  }, [songTitle, artist, albumArt, albumTitle, date, username, birdLogo])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl border border-text/10" onClick={(e) => e.stopPropagation()}>
        {/* Card Preview */}
        <div className="relative aspect-[9/16] bg-gradient-to-b from-bg via-surface to-bg overflow-hidden">
          {/* Ambient glow */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              background: `radial-gradient(circle at 50% 40%, ${accentColor}, transparent 70%)` 
            }}
          />

          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-8">
            {/* Bird + Header */}
            <div className="flex flex-col items-center mb-6">
              <Image
                src={birdLogo}
                alt="Your bird"
                width={56}
                height={56}
                className="object-contain drop-shadow-lg mb-2"
              />
              <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: accentColor }}>
                {dayLabel} song of the day
              </p>
            </div>

            {/* Album Art */}
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 mb-5">
              <div 
                className="absolute -inset-3 rounded-2xl opacity-50 blur-xl"
                style={{ backgroundColor: accentColor }}
              />
              <Image
                src={albumArt}
                alt={songTitle}
                width={192}
                height={192}
                className="relative rounded-xl w-full h-full object-cover ring-1 ring-white/10"
              />
            </div>

            {/* Song Info */}
            <h3 className="text-lg font-bold text-text text-center mb-0.5 line-clamp-2 leading-tight">{songTitle}</h3>
            <p className="text-text/60 text-sm text-center mb-4">{artist}</p>

            {/* Insight Quote */}
            <div 
              className="px-4 py-2 rounded-full border mb-5 max-w-[280px]"
              style={{ 
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}15`,
              }}
            >
              <p className="text-xs italic text-center" style={{ color: `${accentColor}dd` }}>
                &ldquo;{insight}&rdquo;
              </p>
            </div>

            {/* Date & Username */}
            <div className="text-center space-y-0.5 mt-auto">
              <p className="text-text/40 text-xs">{formatDate(date)}</p>
              <p className="text-xs font-semibold" style={{ color: `${accentColor}aa` }}>@{username}</p>
            </div>

            {/* Branding */}
            <div className="mt-3 px-4 py-1.5 rounded-full bg-white/5">
              <p className="text-text/30 text-[10px] font-semibold tracking-wider">🐦  SongBird</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2 border-t border-text/10 bg-bg/50">
          <button
            onClick={generateImage}
            disabled={downloading}
            className="w-full py-3 font-semibold rounded-xl transition-all disabled:opacity-50 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {downloading ? 'Creating...' : 'Download & Share'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-text/50 hover:text-text/70 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
