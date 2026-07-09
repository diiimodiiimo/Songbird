'use client'

/**
 * Fallback for missing album art — a bird mark on a soft accent gradient.
 * Replaces the old 🎵-emoji placeholders so empty art still looks designed.
 * Sized by the parent: give the wrapper the same width/height/rounding you'd
 * give the <Image>.
 */
export default function AlbumArtPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-accent/25 via-surface to-card text-accent/70 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-1/2 h-1/2">
        {/* simple perched-bird silhouette */}
        <path
          d="M19.5 8.5c0-2.5-2-4.5-4.5-4.5-2 0-3.7 1.3-4.3 3.1L4 13.5l6 .5c.4 2.6 2.6 4.5 5.2 4.5.4 0 .8 0 1.2-.1L15 22h3l-1-3.6c1.5-1 2.5-2.7 2.5-4.6V8.5z"
          fill="currentColor"
          opacity="0.9"
        />
        <circle cx="16.2" cy="7.4" r="0.9" fill="var(--bg)" />
        <path d="M19.5 8.5L22 9l-2.5 1.2V8.5z" fill="currentColor" />
      </svg>
    </div>
  )
}
