import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { Aviary } from '@/components/aviary/Aviary'
import { AviaryPageClient } from './AviaryPageClient'
import Navigation from '@/components/Navigation'

export const metadata = {
  title: 'The Aviary | SongBird',
  description: 'See what your flock is listening to',
}

export default async function AviaryPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <Navigation />
      <main className="container mx-auto px-4 py-6 pb-24">
        <AviaryPageClient />
      </main>
    </div>
  )
}







