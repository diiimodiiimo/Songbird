/**
 * Client-side dominant-color extraction for album art.
 *
 * Downscales the artwork onto a tiny canvas and averages the pixels,
 * weighting saturated ones so the result feels like the cover rather than
 * its gray average. Returns a hex string, or null if the image can't be
 * read (CORS, decode failure) — callers must treat color as optional.
 */
export function extractAlbumColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !imageUrl) return resolve(null)

    const img = document.createElement('img')
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const size = 12
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        let r = 0
        let g = 0
        let b = 0
        let weightSum = 0
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i]
          const pg = data[i + 1]
          const pb = data[i + 2]
          const max = Math.max(pr, pg, pb)
          const min = Math.min(pr, pg, pb)
          // Weight by saturation (+ a floor so grayscale covers still resolve)
          const weight = (max - min) / 255 + 0.08
          r += pr * weight
          g += pg * weight
          b += pb * weight
          weightSum += weight
        }
        if (weightSum === 0) return resolve(null)
        r = Math.round(r / weightSum)
        g = Math.round(g / weightSum)
        b = Math.round(b / weightSum)

        const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
        resolve(hex)
      } catch {
        // Canvas is tainted (no CORS) or decode failed
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = imageUrl
  })
}

/**
 * CSS gradient that tints a card with the album's color without
 * overpowering the theme. Works over any dark surface.
 */
export function albumTintStyle(albumColor?: string | null): React.CSSProperties {
  if (!albumColor || !/^#[0-9a-fA-F]{6}$/.test(albumColor)) return {}
  return {
    backgroundImage: `linear-gradient(135deg, ${albumColor}52 0%, ${albumColor}1f 45%, transparent 80%)`,
  }
}
