'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function WelcomePage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // Staggered animations
    const timer1 = setTimeout(() => setShowContent(true), 300)
    const timer2 = setTimeout(() => setShowFeatures(true), 800)
    const timer3 = setTimeout(() => setShowButton(true), 1500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  useEffect(() => {
    // If not signed in, redirect to home
    if (isLoaded && !isSignedIn) {
      router.push('/home')
    }
  }, [isLoaded, isSignedIn, router])

  const handleContinue = () => {
    router.push('/')
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-pulse">
          <Image
            src="/SongBirdlogo.png"
            alt="SongBird"
            width={100}
            height={100}
            className="object-contain"
            priority
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/2 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-lg mt-8">
        {/* Animated Bird Logo - Clickable */}
        <div 
          className={`mb-4 transition-all duration-1000 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
          }`}
        >
          <button
            onClick={handleContinue}
            className="relative inline-block group cursor-pointer focus:outline-none"
            aria-label="Begin your journey"
          >
            {/* Glow effect - pulses more on hover */}
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl scale-150 animate-pulse group-hover:bg-accent/40 transition-all duration-300" />
            
            {/* Flying animation - subtle hover scale */}
            <div className="relative animate-bounce group-hover:scale-110 transition-transform duration-300" style={{ animationDuration: '3s' }}>
              <Image
                src="/SongBirdlogo.png"
                alt="SongBird"
                width={140}
                height={140}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
            
            {/* Music notes floating */}
            <span className="absolute -top-4 -right-4 text-3xl animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '2s' }}>🎵</span>
            <span className="absolute top-0 -left-6 text-2xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>🎶</span>
            <span className="absolute -bottom-2 right-0 text-2xl animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '2.2s' }}>✨</span>
          </button>
          
          {/* Tap instruction */}
          <p 
            className={`text-accent/80 text-sm mt-4 animate-pulse transition-opacity duration-1000 ${
              showButton ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ animationDuration: '2s' }}
          >
            ✨ Tap the bird to begin your journey ✨
          </p>
        </div>

        {/* Welcome Text */}
        <div 
          className={`transition-all duration-1000 delay-300 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-text mb-3">
            Welcome to <span className="text-accent">SongBird</span>
          </h1>
          {user?.firstName && (
            <p className="text-xl text-accent mb-2">
              Hey {user.firstName}! 👋
            </p>
          )}
          <p className="text-lg text-text/70 mb-8">
            Your personal music diary awaits
          </p>
        </div>

        {/* Features */}
        <div 
          className={`space-y-4 mb-10 transition-all duration-1000 ${
            showFeatures ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex items-center gap-4 p-4 bg-surface/50 backdrop-blur-sm rounded-xl border border-text/10">
            <div className="text-3xl">📝</div>
            <div className="text-left">
              <div className="font-semibold text-text">Daily Song Journal</div>
              <div className="text-sm text-text/60">Log the song that defined your day</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-surface/50 backdrop-blur-sm rounded-xl border border-text/10" style={{ transitionDelay: '100ms' }}>
            <div className="text-3xl">📅</div>
            <div className="text-left">
              <div className="font-semibold text-text">On This Day Memories</div>
              <div className="text-sm text-text/60">Rediscover songs from years past</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-surface/50 backdrop-blur-sm rounded-xl border border-text/10" style={{ transitionDelay: '200ms' }}>
            <div className="text-3xl">👥</div>
            <div className="text-left">
              <div className="font-semibold text-text">Share With Friends</div>
              <div className="text-sm text-text/60">See what your friends are listening to</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-surface/50 backdrop-blur-sm rounded-xl border border-text/10" style={{ transitionDelay: '300ms' }}>
            <div className="text-3xl">📊</div>
            <div className="text-left">
              <div className="font-semibold text-text">Music Insights</div>
              <div className="text-sm text-text/60">Discover your listening patterns</div>
            </div>
          </div>
        </div>

        {/* Alternative Continue Button */}
        <div 
          className={`transition-all duration-700 ${
            showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-surface/50 backdrop-blur-sm border border-text/20 text-text font-medium rounded-xl hover:bg-accent hover:text-bg hover:border-accent transition-all duration-300"
          >
            Or press here to continue →
          </button>
        </div>
      </div>
    </div>
  )
}

