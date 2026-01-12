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

      <div className="relative z-10 text-center max-w-lg">
        {/* Animated Bird Logo */}
        <div 
          className={`mb-8 transition-all duration-1000 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
          }`}
        >
          <div className="relative inline-block">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl scale-150 animate-pulse" />
            
            {/* Flying animation */}
            <div className="relative animate-bounce" style={{ animationDuration: '3s' }}>
              <Image
                src="/SongBirdlogo.png"
                alt="SongBird"
                width={150}
                height={150}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
            
            {/* Music notes floating */}
            <span className="absolute -top-4 -right-4 text-3xl animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '2s' }}>🎵</span>
            <span className="absolute top-0 -left-6 text-2xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>🎶</span>
            <span className="absolute -bottom-2 right-0 text-2xl animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '2.2s' }}>✨</span>
          </div>
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

        {/* Continue Button */}
        <div 
          className={`transition-all duration-700 ${
            showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <button
            onClick={handleContinue}
            className="group relative px-10 py-4 bg-accent text-bg font-bold text-lg rounded-xl hover:bg-accent/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/25"
          >
            <span className="relative z-10 flex items-center gap-2">
              Let's Go
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
          
          <p className="mt-4 text-sm text-text/40">
            Start logging your first song of the day
          </p>
        </div>
      </div>
    </div>
  )
}

