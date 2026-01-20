'use client'

import Image from 'next/image'
import { getThemeById, getBirdLogo } from '@/lib/theme'
import type { AviaryBird as AviaryBirdType } from '@/types/aviary'

interface AviaryBirdProps {
  bird: AviaryBirdType
  size: 'small' | 'large'
  position?: { x: number; y: number }
  onTap: () => void
}

export function AviaryBird({ bird, size, position, onTap }: AviaryBirdProps) {
  const { user, latestSong, isCurrentUser } = bird
  const theme = getThemeById(user.theme)
  
  // Check if song was logged today
  const hasLoggedToday = latestSong && isToday(new Date(latestSong.createdAt))

  const sizeClasses = {
    small: 'w-14 h-14 sm:w-16 sm:h-16',
    large: 'w-20 h-20 sm:w-24 sm:h-24',
  }

  const iconSize = size === 'large' ? 80 : 56

  const style = position
    ? {
        position: 'absolute' as const,
        left: `calc(50% + ${position.x}%)`,
        top: `calc(50% + ${position.y}%)`,
        transform: 'translate(-50%, -50%)',
      }
    : {}

  return (
    <button
      className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg rounded-xl p-2"
      style={style}
      onClick={onTap}
      aria-label={`View ${isCurrentUser ? 'your' : `${user.username}'s`} song`}
    >
      {/* Bird icon */}
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        <Image
          src={getBirdLogo(user.theme)}
          alt={`${theme.shortName} bird`}
          width={iconSize}
          height={iconSize}
          className="object-contain drop-shadow-lg"
        />
        
        {/* Activity indicator - musical note for logged today */}
        {hasLoggedToday && (
          <span 
            className="absolute -top-1 -right-1 text-primary animate-bounce text-sm"
            aria-hidden="true"
          >
            ♪
          </span>
        )}
      </div>

      {/* Username */}
      <span className={`text-text-muted font-medium ${size === 'large' ? 'text-sm' : 'text-xs'}`}>
        {isCurrentUser ? 'You' : user.username}
      </span>
    </button>
  )
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

