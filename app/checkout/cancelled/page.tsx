'use client'

import { useRouter } from 'next/navigation'
import ThemeBird from '@/components/ThemeBird'
import Link from 'next/link'

export default function CheckoutCancelledPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-surface rounded-xl p-8 md:p-12 border border-accent/20 text-center">
          {/* Bird */}
          <div className="mb-6 flex justify-center">
            <ThemeBird size={120} state="idle" />
          </div>

          <h1 className="text-4xl font-bold text-text mb-4">Checkout Cancelled</h1>
          
          <p className="text-xl text-text/70 mb-6">
            No worries! Your payment wasn't processed. You can try again anytime.
          </p>

          <p className="text-text/60 mb-8">
            If you have any questions or need help, feel free to reach out to us.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/settings/premium"
              className="px-6 py-3 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all"
            >
              Try Again
            </Link>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-surface border border-accent/30 text-accent font-semibold rounded-xl hover:bg-surface/80 transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


