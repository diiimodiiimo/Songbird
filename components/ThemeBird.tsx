'use client'

import Image from 'next/image'
import { useTheme } from '@/lib/theme'
import { useState, useEffect } from 'react'

export type BirdState = 
  | 'idle'
  | 'bounce'
  | 'sing'
  | 'fly'
  | 'happy'
  | 'sleepy'
  | 'proud'
  | 'curious'
  | 'float'
  | 'ruffle'
  | 'enter'

interface ThemeBirdProps {
  /** Size in pixels (width = height) */
  size?: number
  /** Custom className for the container */
  className?: string
  /** Whether the bird is clickable and shows fly animation */
  interactive?: boolean
  /** Current animation state */
  state?: BirdState
  /** Callback when bird is clicked */
  onClick?: () => void
  /** Show the bird name tooltip on hover */
  showTooltip?: boolean
  /** Alt text override */
  alt?: string
  /** Show particles (music notes, hearts) based on state */
  showParticles?: boolean
}

export default function ThemeBird({
  size = 24,
  className = '',
  interactive = false,
  state = 'idle',
  onClick,
  showTooltip = false,
  alt,
  showParticles = true,
}: ThemeBirdProps) {
  const { currentTheme } = useTheme()
  const [isFlying, setIsFlying] = useState(false)
  const [showName, setShowName] = useState(false)
  const [particles, setParticles] = useState<{ id: number; type: string; style: React.CSSProperties }[]>([])

  // Spawn particles for certain states
  useEffect(() => {
    if (!showParticles) return
    
    if (state === 'sing') {
      const interval = setInterval(() => {
        const id = Date.now()
        const side = Math.random() > 0.5 ? 1 : -1
        setParticles(prev => [...prev.slice(-5), {
          id,
          type: ['♪', '♫', '♬'][Math.floor(Math.random() * 3)],
          style: {
            left: `${50 + side * (20 + Math.random() * 20)}%`,
            animationDelay: `${Math.random() * 0.2}s`,
          }
        }])
        setTimeout(() => {
          setParticles(prev => prev.filter(p => p.id !== id))
        }, 1500)
      }, 600)
      return () => clearInterval(interval)
    }
    
    if (state === 'happy') {
      const hearts = [1, 2, 3].map((_, i) => ({
        id: Date.now() + i,
        type: '❤️',
        style: {
          left: `${30 + i * 20}%`,
          animationDelay: `${i * 0.15}s`,
        }
      }))
      setParticles(hearts)
      setTimeout(() => setParticles([]), 1000)
    }
  }, [state, showParticles])

  const handleClick = () => {
    if (interactive) {
      setIsFlying(true)
      // Add sparkle particles on click
      if (showParticles) {
        const sparkles = [1, 2, 3, 4].map((_, i) => ({
          id: Date.now() + i,
          type: '✨',
          style: {
            left: `${20 + i * 20}%`,
            top: `${20 + (i % 2) * 40}%`,
            animationDelay: `${i * 0.1}s`,
          }
        }))
        setParticles(sparkles)
      }
      setTimeout(() => {
        setIsFlying(false)
        setParticles([])
      }, 1500)
    }
    onClick?.()
  }

  // Get animation class based on state - now using enhanced CSS animations
  const getAnimationClass = () => {
    if (isFlying) return 'animate-bird-fly-across'
    
    switch (state) {
      case 'bounce':
        return 'animate-bird-bob'
      case 'sing':
        return 'animate-bird-sing'
      case 'happy':
        return 'animate-bird-hop'
      case 'sleepy':
        return 'animate-bird-sleepy'
      case 'proud':
        return 'animate-bird-proud'
      case 'curious':
        return 'animate-bird-tilt'
      case 'float':
        return 'animate-bird-float'
      case 'ruffle':
        return 'animate-bird-ruffle'
      case 'enter':
        return 'animate-bird-enter'
      case 'fly':
        return 'animate-bird-flap'
      case 'idle':
      default:
        return 'animate-bird-breathe'
    }
  }

  // Painted Bunting gets special rainbow glow
  const isPainted = currentTheme.id === 'painted-bunting'

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => showTooltip && setShowName(true)}
      onMouseLeave={() => setShowName(false)}
    >
      {/* Particles container */}
      {showParticles && particles.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {particles.map(p => (
            <span
              key={p.id}
              className="absolute animate-note-float text-primary"
              style={{ ...p.style, top: '-10%', fontSize: size * 0.25 }}
            >
              {p.type}
            </span>
          ))}
        </div>
      )}

      <div
        className={`
          relative transition-all duration-300
          ${interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}
          ${getAnimationClass()}
          ${isPainted ? 'bird-glow-rainbow' : ''}
        `}
        onClick={handleClick}
        style={{ width: size, height: size }}
      >
        <Image
          src={currentTheme.birdLogo}
          alt={alt || `${currentTheme.name} - Your SongBird`}
          width={size}
          height={size}
          className="object-contain"
          priority={size >= 48}
        />
      </div>

      {/* Tooltip showing bird name */}
      {showTooltip && showName && (
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface text-text text-xs rounded whitespace-nowrap z-50 shadow-lg border border-text/10"
        >
          {currentTheme.shortName}
        </div>
      )}
    </div>
  )
}

// Logo with text component for headers
interface ThemeBirdLogoProps {
  size?: number
  showText?: boolean
  textSize?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  interactive?: boolean
  showTooltip?: boolean
}

export function ThemeBirdLogo({
  size = 24,
  showText = true,
  textSize = 'lg',
  className = '',
  interactive = false,
  showTooltip = false,
}: ThemeBirdLogoProps) {
  const { currentTheme } = useTheme()

  const textSizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
  }[textSize]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ThemeBird size={size} interactive={interactive} showTooltip />
      {showText && (
        <span className={`font-bold text-primary ${textSizeClass}`}>
          SongBird
        </span>
      )}
    </div>
  )
}

// Large bird display for profile/dashboard
interface ThemeBirdDisplayProps {
  size?: number
  showName?: boolean
  interactive?: boolean
  className?: string
  state?: BirdState
}

export function ThemeBirdDisplay({
  size = 120,
  showName = true,
  interactive = true,
  className = '',
  state = 'enter',
}: ThemeBirdDisplayProps) {
  const { currentTheme } = useTheme()
  const [hoverState, setHoverState] = useState<BirdState>(state)

  return (
    <div 
      className={`flex flex-col items-center gap-3 ${className}`}
      onMouseEnter={() => setHoverState('happy')}
      onMouseLeave={() => setHoverState(state)}
    >
      <ThemeBird size={size} interactive={interactive} state={hoverState} showParticles />
      {showName && (
        <div className="text-center animate-fade-in">
          <div className="text-lg font-semibold text-text">{currentTheme.shortName}</div>
          <div className="text-sm text-text-muted">{currentTheme.description}</div>
        </div>
      )}
    </div>
  )
}

