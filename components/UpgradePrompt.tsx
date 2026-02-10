'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeBird from '@/components/ThemeBird'

interface UpgradePromptProps {
  title: string
  message: string
  feature?: string
  currentCount?: number
  limit?: number
  compact?: boolean
}

export function UpgradePrompt({ 
  title, 
  message, 
  feature,
  currentCount,
  limit,
  compact = false 
}: UpgradePromptProps) {
  const router = useRouter()

  if (compact) {
    return (
      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <ThemeBird size={40} state="idle" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text mb-1">{title}</h3>
            <p className="text-sm text-text/70 mb-3">{message}</p>
            {currentCount !== undefined && limit !== undefined && (
              <div className="text-xs text-text/60 mb-3">
                {currentCount} / {limit === Infinity ? '∞' : limit} used
              </div>
            )}
            <Link
              href="/settings/premium"
              className="inline-block px-4 py-2 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-all text-sm"
            >
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-accent/20 to-accent/10 border-2 border-accent/40 rounded-xl p-6 md:p-8 text-center">
      <div className="mb-4 flex justify-center">
        <ThemeBird size={80} state="sing" />
      </div>
      <h2 className="text-2xl font-bold text-text mb-2">{title}</h2>
      <p className="text-text/70 mb-4 max-w-md mx-auto">{message}</p>
      {currentCount !== undefined && limit !== undefined && (
        <div className="mb-4">
          <div className="text-sm text-text/60 mb-2">
            {currentCount} / {limit === Infinity ? '∞' : limit} {feature || 'items'} used
          </div>
          <div className="w-full max-w-xs mx-auto h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${Math.min(100, (currentCount / (limit === Infinity ? currentCount + 1 : limit)) * 100)}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/settings/premium"
          className="px-6 py-3 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all"
        >
          Upgrade to Premium
        </Link>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-surface border border-accent/30 text-accent font-semibold rounded-xl hover:bg-surface/80 transition-all"
        >
          Maybe Later
        </button>
      </div>
    </div>
  )
}


