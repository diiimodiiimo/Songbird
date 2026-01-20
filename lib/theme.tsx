'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'

export type ThemeId = 
  | 'american-robin'
  | 'northern-cardinal'
  | 'eastern-bluebird'
  | 'american-goldfinch'
  | 'baltimore-oriole'
  | 'indigo-bunting'
  | 'house-finch'
  | 'cedar-waxwing'
  | 'black-capped-chickadee'
  | 'painted-bunting'

export interface Theme {
  id: ThemeId
  name: string
  shortName: string
  description: string
  birdLogo: string
  colors: {
    primary: string
    accent: string
    bg: string
    surface: string
    card: string
    text: string
    textMuted: string
  }
}

export const themes: Theme[] = [
  {
    id: 'american-robin',
    name: 'American Robin',
    shortName: 'Robin',
    description: 'Warm rust-orange with golden amber',
    birdLogo: '/SongBirdlogo.png',
    colors: {
      primary: '#D2691E',
      accent: '#F4A460',
      bg: '#1A1A1A',
      surface: '#2A2A2A',
      card: '#333333',
      text: '#F5F5F5',
      textMuted: '#A0A0A0',
    },
  },
  {
    id: 'northern-cardinal',
    name: 'Northern Cardinal',
    shortName: 'Cardinal',
    description: 'Vivid crimson with soft coral pink',
    birdLogo: '/cardinal - Edited.png',
    colors: {
      primary: '#C41E3A',
      accent: '#FF6B6B',
      bg: '#141414',
      surface: '#2A2228',
      card: '#3A2A32',
      text: '#FAFAFA',
      textMuted: '#B0A0A5',
    },
  },
  {
    id: 'eastern-bluebird',
    name: 'Eastern Bluebird',
    shortName: 'Bluebird',
    description: 'Soft sky blue with warm peach',
    birdLogo: '/Easternbluebird - Edited.png',
    colors: {
      primary: '#6CA0DC',
      accent: '#E8A87C',
      bg: '#0F1520',
      surface: '#1A2535',
      card: '#243345',
      text: '#F0F4F8',
      textMuted: '#8BA4B8',
    },
  },
  {
    id: 'american-goldfinch',
    name: 'American Goldfinch',
    shortName: 'Goldfinch',
    description: 'Bright lemon yellow with olive',
    birdLogo: '/americangoldfinch - Edited.png',
    colors: {
      primary: '#FFD700',
      accent: '#9CB071',
      bg: '#141810',
      surface: '#1E241A',
      card: '#2A3224',
      text: '#FFFEF5',
      textMuted: '#A8B098',
    },
  },
  {
    id: 'baltimore-oriole',
    name: 'Baltimore Oriole',
    shortName: 'Oriole',
    description: 'Deep orange with warm gold',
    birdLogo: '/baltimoreoriole - Edited.png',
    colors: {
      primary: '#FF6600',
      accent: '#FFB347',
      bg: '#12100E',
      surface: '#221E1A',
      card: '#2E2822',
      text: '#FFF8F0',
      textMuted: '#B0A090',
    },
  },
  {
    id: 'indigo-bunting',
    name: 'Indigo Bunting',
    shortName: 'Bunting',
    description: 'Electric indigo with bright violet',
    birdLogo: '/indigobunting - Edited.png',
    colors: {
      primary: '#4B0082',
      accent: '#8A2BE2',
      bg: '#0C0A14',
      surface: '#1A1528',
      card: '#252038',
      text: '#F5F0FF',
      textMuted: '#9080A8',
    },
  },
  {
    id: 'house-finch',
    name: 'House Finch',
    shortName: 'Finch',
    description: 'Dusty rose-red with soft blush',
    birdLogo: '/housefinch - Edited.png',
    colors: {
      primary: '#B5495B',
      accent: '#D4A5A5',
      bg: '#171515',
      surface: '#252022',
      card: '#322A2E',
      text: '#F8F5F5',
      textMuted: '#A89898',
    },
  },
  {
    id: 'cedar-waxwing',
    name: 'Cedar Waxwing',
    shortName: 'Waxwing',
    description: 'Warm tan with berry red accent',
    birdLogo: '/cedarwaxwing - Edited.png',
    colors: {
      primary: '#C2A878',
      accent: '#8B0000',
      bg: '#14120E',
      surface: '#221F1A',
      card: '#2E2A24',
      text: '#F5F2EB',
      textMuted: '#A8A090',
    },
  },
  {
    id: 'black-capped-chickadee',
    name: 'Black-capped Chickadee',
    shortName: 'Chickadee',
    description: 'Soft gray with warm buff',
    birdLogo: '/blackchickadee - Edited.png',
    colors: {
      primary: '#8C8C8C',
      accent: '#D4B896',
      bg: '#121212',
      surface: '#1E1E1E',
      card: '#2A2A2A',
      text: '#FFFFFF',
      textMuted: '#909090',
    },
  },
  {
    id: 'painted-bunting',
    name: 'Painted Bunting',
    shortName: 'Painted',
    description: '✨ Premium multicolor theme',
    birdLogo: '/paintedbunting - Edited.png',
    colors: {
      primary: '#00AA44',
      accent: '#AAFF00',
      bg: '#0A1214',
      surface: '#142028',
      card: '#1E2E38',
      text: '#FFFFFF',
      textMuted: '#78A0A8',
    },
  },
]

// Helper function to get a theme by ID
export function getThemeById(themeId: ThemeId): Theme {
  return themes.find(t => t.id === themeId) || themes[0]
}

// Helper function to get the bird logo for a theme
export function getBirdLogo(themeId: ThemeId): string {
  const theme = themes.find(t => t.id === themeId)
  return theme?.birdLogo || '/SongBirdlogo.png'
}

interface ThemeContextType {
  currentTheme: Theme
  setTheme: (themeId: ThemeId) => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser()
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0])
  const [isLoading, setIsLoading] = useState(false)

  // Load theme from localStorage on mount (for immediate display)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('songbird-theme') as ThemeId | null
      if (savedTheme) {
        const theme = themes.find(t => t.id === savedTheme)
        if (theme) {
          setCurrentTheme(theme)
          document.documentElement.setAttribute('data-theme', theme.id)
        }
      }
    }
  }, [])

  // Load theme from server when user is signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchThemeFromServer()
    }
  }, [isLoaded, isSignedIn])

  const fetchThemeFromServer = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        const userTheme = data.user?.theme as ThemeId | undefined
        if (userTheme) {
          const theme = themes.find(t => t.id === userTheme)
          if (theme) {
            setCurrentTheme(theme)
            document.documentElement.setAttribute('data-theme', theme.id)
            localStorage.setItem('songbird-theme', theme.id)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch theme from server:', error)
    }
  }

  const setTheme = useCallback(async (themeId: ThemeId) => {
    const theme = themes.find(t => t.id === themeId)
    if (!theme) return

    setIsLoading(true)
    
    // Apply theme immediately for responsiveness
    setCurrentTheme(theme)
    document.documentElement.setAttribute('data-theme', theme.id)
    localStorage.setItem('songbird-theme', theme.id)

    // Save to server if signed in
    if (isSignedIn) {
      try {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: themeId }),
        })
      } catch (error) {
        console.error('Failed to save theme to server:', error)
      }
    }

    setIsLoading(false)
  }, [isSignedIn])

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme.id)
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
