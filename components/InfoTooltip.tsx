'use client'

import { useState, useRef, useEffect } from 'react'

interface InfoTooltipProps {
  title?: string
  children: React.ReactNode
  className?: string
  iconSize?: number
}

export default function InfoTooltip({ title, children, className = '', iconSize = 16 }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className={`relative inline-flex ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center rounded-full text-text/40 hover:text-text/70 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30"
        aria-label={title || 'More info'}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="5" r="0.75" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80">
          <div className="bg-surface border border-text/20 rounded-xl shadow-xl p-4 text-sm">
            {title && (
              <h4 className="font-semibold text-text mb-2">{title}</h4>
            )}
            <div className="text-text/70 leading-relaxed space-y-2">
              {children}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-3 text-xs text-accent hover:text-accent/80 transition-colors"
            >
              Got it
            </button>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="w-3 h-3 bg-surface border-r border-b border-text/20 rotate-45" />
          </div>
        </div>
      )}
    </div>
  )
}
