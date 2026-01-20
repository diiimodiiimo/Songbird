'use client'

import { useTheme, themes, Theme, ThemeId } from '@/lib/theme'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface BirdStatus {
  birdId: string
  isUnlocked: boolean
  progress?: {
    current: number
    required: number
    percentage: number
    label: string
  }
}

interface ThemeSelectorProps {
  compact?: boolean
}

export default function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const { currentTheme, setTheme, isLoading } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const [birdStatuses, setBirdStatuses] = useState<BirdStatus[]>([])
  const [loadingStatuses, setLoadingStatuses] = useState(true)

  // Fetch bird unlock statuses
  useEffect(() => {
    async function fetchStatuses() {
      try {
        const res = await fetch('/api/birds/status')
        if (res.ok) {
          const data = await res.json()
          setBirdStatuses(data.birds || [])
        }
      } catch (err) {
        console.error('Error fetching bird statuses:', err)
      } finally {
        setLoadingStatuses(false)
      }
    }
    fetchStatuses()
  }, [])

  const isBirdUnlocked = (themeId: ThemeId): boolean => {
    // If still loading, assume unlocked to avoid flicker
    if (loadingStatuses) return true
    const status = birdStatuses.find(s => s.birdId === themeId)
    return status?.isUnlocked ?? (themeId === 'american-robin') // Default bird always unlocked
  }

  const getBirdProgress = (themeId: ThemeId): BirdStatus['progress'] | undefined => {
    const status = birdStatuses.find(s => s.birdId === themeId)
    return status?.progress
  }

  const handleThemeSelect = async (themeId: ThemeId) => {
    // Only allow selecting unlocked birds
    if (!isBirdUnlocked(themeId)) {
      return
    }
    await setTheme(themeId)
    if (compact) {
      setIsExpanded(false)
    }
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 w-full px-4 py-3 bg-bg border border-surface rounded-lg hover:border-primary/30 transition-colors"
        >
          {/* Bird preview */}
          <div className="w-8 h-8 relative flex-shrink-0">
            <Image
              src={currentTheme.birdLogo}
              alt={currentTheme.name}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">{currentTheme.name}</div>
            <div className="text-xs text-text-muted">{currentTheme.description}</div>
          </div>
          <svg
            className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-text/10 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
            {themes.map((theme) => (
              <ThemeOption
                key={theme.id}
                theme={theme}
                isSelected={currentTheme.id === theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                isLoading={isLoading}
                isUnlocked={isBirdUnlocked(theme.id)}
                progress={getBirdProgress(theme.id)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          isSelected={currentTheme.id === theme.id}
          onClick={() => handleThemeSelect(theme.id)}
          isLoading={isLoading}
          isUnlocked={isBirdUnlocked(theme.id)}
          progress={getBirdProgress(theme.id)}
        />
      ))}
    </div>
  )
}

function ThemeOption({
  theme,
  isSelected,
  onClick,
  isLoading,
  isUnlocked,
  progress,
}: {
  theme: Theme
  isSelected: boolean
  onClick: () => void
  isLoading: boolean
  isUnlocked: boolean
  progress?: BirdStatus['progress']
}) {
  const isLocked = !isUnlocked

  return (
    <button
      onClick={onClick}
      disabled={isLoading || isLocked}
      className={`
        flex items-center gap-3 w-full px-4 py-3 text-left transition-colors
        ${isSelected ? 'bg-primary/10' : isLocked ? 'opacity-60' : 'hover:bg-bg/50'}
        ${isLoading || isLocked ? 'cursor-not-allowed' : ''}
      `}
    >
      {/* Bird preview */}
      <div className={`w-10 h-10 relative flex-shrink-0 rounded-lg overflow-hidden ${isLocked ? 'grayscale' : ''}`} style={{ backgroundColor: theme.colors.bg }}>
        <Image
          src={theme.birdLogo}
          alt={theme.name}
          width={40}
          height={40}
          className="object-contain"
        />
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="text-lg">🔒</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{theme.name}</div>
        {isLocked && progress ? (
          <div className="text-xs text-text-muted truncate">{progress.label}</div>
        ) : (
          <div className="text-xs text-text-muted truncate">{theme.description}</div>
        )}
      </div>
      {isSelected && !isLocked && (
        <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  )
}

function ThemeCard({
  theme,
  isSelected,
  onClick,
  isLoading,
  isUnlocked,
  progress,
}: {
  theme: Theme
  isSelected: boolean
  onClick: () => void
  isLoading: boolean
  isUnlocked: boolean
  progress?: BirdStatus['progress']
}) {
  const isLocked = !isUnlocked

  return (
    <button
      onClick={onClick}
      disabled={isLoading || isLocked}
      className={`
        relative p-4 rounded-xl transition-all duration-200 text-left
        ${isSelected 
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg scale-[1.02]' 
          : isLocked ? '' : 'hover:scale-[1.02] hover:shadow-lg'
        }
        ${isLoading || isLocked ? 'opacity-60 cursor-not-allowed' : ''}
      `}
      style={{ backgroundColor: theme.colors.surface }}
    >
      {/* Bird preview - centered at top */}
      <div className="flex justify-center mb-3">
        <div 
          className={`w-16 h-16 relative rounded-lg overflow-hidden p-1 ${isLocked ? 'grayscale' : ''}`}
          style={{ backgroundColor: theme.colors.bg }}
        >
          <Image
            src={theme.birdLogo}
            alt={theme.name}
            width={56}
            height={56}
            className="object-contain w-full h-full"
          />
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
              <span className="text-2xl">🔒</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for locked birds */}
      {isLocked && progress && (
        <div className="mb-2">
          <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${progress.percentage}%`,
                backgroundColor: theme.colors.primary 
              }}
            />
          </div>
          <div className="text-[10px] text-center mt-1 opacity-70" style={{ color: theme.colors.text }}>
            {progress.label}
          </div>
        </div>
      )}

      {/* Color dots - only show if unlocked */}
      {!isLocked && (
        <div className="flex justify-center gap-1 mb-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.colors.primary }}
            title="Primary"
          />
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.colors.accent }}
            title="Accent"
          />
        </div>
      )}

      {/* Theme name */}
      <div
        className="font-semibold text-sm mb-1 truncate text-center"
        style={{ color: theme.colors.text }}
      >
        {theme.shortName}
      </div>

      {/* Selected indicator */}
      {isSelected && !isLocked && (
        <div
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <svg className="w-4 h-4" fill="white" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* Special badge for Painted Bunting */}
      {theme.id === 'painted-bunting' && !isLocked && (
        <div
          className="absolute -top-1 -left-1 px-2 py-0.5 text-[10px] font-bold rounded-full"
          style={{
            background: 'linear-gradient(135deg, #0066CC, #00AA44, #CC0033)',
            color: 'white',
          }}
        >
          ✨
        </div>
      )}
    </button>
  )
}
