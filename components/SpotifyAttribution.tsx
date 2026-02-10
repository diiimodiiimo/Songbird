'use client'

interface SpotifyAttributionProps {
  variant?: 'minimal' | 'default'
  className?: string
}

/**
 * Spotify Attribution Component
 * Displays "Powered by Spotify" attribution as required by Spotify API Terms Section 5.3
 * 
 * Uses official Spotify green (#1DB954) and displays on all pages that show song data
 */
export default function SpotifyAttribution({ variant = 'default', className = '' }: SpotifyAttributionProps) {
  const isMinimal = variant === 'minimal'
  
  return (
    <div className={`flex items-center gap-2 ${isMinimal ? 'text-xs' : 'text-sm'} ${className}`}>
      {/* Spotify Logo - Green circle with play icon */}
      <div 
        className="flex-shrink-0"
        style={{ width: isMinimal ? '16px' : '20px', height: isMinimal ? '16px' : '20px' }}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="#1DB954" 
          className="w-full h-full"
          aria-label="Spotify"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.419.24-.66.54-.84 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      </div>
      
      {/* Text */}
      <span 
        className="text-text/60"
        style={{ color: '#B3B3B3' }}
      >
        Powered by Spotify
      </span>
    </div>
  )
}



