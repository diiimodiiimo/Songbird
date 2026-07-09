'use client'

/**
 * Shimmer placeholders shown while content loads — shaped like the content
 * they stand in for, instead of "Loading..." text.
 */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-text/10 rounded ${className}`} />
}

/** Placeholder matching a feed card. */
export function FeedCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl overflow-hidden border-2 border-transparent">
      <div className="border-b border-white/5 p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex gap-3 sm:gap-4">
          <Skeleton className="w-20 h-20 sm:w-[100px] sm:h-[100px] rounded-lg flex-shrink-0" />
          <div className="flex-1 pt-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface">
          <Skeleton className="h-9 w-16 rounded-lg" />
          <Skeleton className="h-9 w-16 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg ml-auto" />
        </div>
      </div>
    </div>
  )
}

/** Placeholder matching an On This Day memory card. */
export function MemoryCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl p-5 sm:p-6">
      <Skeleton className="h-4 w-12 mb-3" />
      <Skeleton className="h-7 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/3 mb-5" />
      <div className="flex items-end gap-5 mb-4">
        <Skeleton className="w-28 h-28 rounded-lg flex-shrink-0" />
        <Skeleton className="h-14 w-14 rounded-lg" />
      </div>
      <Skeleton className="h-3.5 w-full mb-2" />
      <Skeleton className="h-3.5 w-4/5" />
    </div>
  )
}

/** Placeholder matching a compact recent-entry row. */
export function RecentEntrySkeleton() {
  return (
    <div className="bg-surface rounded-lg p-4">
      <div className="flex gap-3">
        <Skeleton className="w-[60px] h-[60px] rounded-lg flex-shrink-0" />
        <div className="flex-1 pt-1">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-5 w-2/3 mb-2" />
          <Skeleton className="h-3.5 w-1/3" />
        </div>
      </div>
    </div>
  )
}
