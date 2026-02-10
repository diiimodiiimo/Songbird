import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

interface Milestone {
  type: string
  message: string
  achieved: boolean
  achievedDate?: string
  icon?: string
  headline?: string
  body?: string
  reward?: {
    icon: string
    text: string
  } | null
  progress?: {
    current: number
    target: number
    message: string
  }
}

const milestoneDefinitions = [
  {
    type: 'streak_3',
    message: "3 Days Strong! 🔥",
    icon: '🔥',
    headline: "3 Days Strong! 🔥",
    body: "You're building a habit. Keep it up!",
    check: (entryCount: number, daysSinceFirst: number, currentStreak: number) => currentStreak >= 3,
    reward: null,
  },
  {
    type: 'streak_7',
    message: 'One Week Streak! 🎉',
    icon: '🎉',
    headline: 'One Week Streak! 🎉',
    body: "A week of musical memories. You've unlocked your first bird theme!",
    check: (entryCount: number, daysSinceFirst: number, currentStreak: number) => currentStreak >= 7,
    reward: {
      icon: '🎨',
      text: 'Robin theme unlocked',
    },
  },
  {
    type: 'streak_30',
    message: '30 Days of Music! 🏆',
    icon: '🏆',
    headline: '30 Days of Music! 🏆',
    body: "A month of your life, captured in song. This is incredible.",
    check: (entryCount: number, daysSinceFirst: number, currentStreak: number) => currentStreak >= 30,
    reward: {
      icon: '🎨',
      text: 'Cardinal theme unlocked + B-sides feature',
    },
  },
  {
    type: 'entries_100',
    message: '100 Entries! 🎊',
    icon: '🎊',
    headline: '100 Entries! 🎊',
    body: "You're not just tracking songs anymore—you're building a legacy.",
    check: (entryCount: number, daysSinceFirst: number, currentStreak: number) => entryCount >= 100,
    reward: {
      icon: '🏅',
      text: 'Exclusive 100-day badge',
    },
  },
  {
    type: 'streak_365',
    message: 'One Year of SongBird! 🌟',
    icon: '🌟',
    headline: 'One Year of SongBird! 🌟',
    body: "365 days. 365 songs. 365 memories. You've built something extraordinary.",
    check: (entryCount: number, daysSinceFirst: number, currentStreak: number) => currentStreak >= 365,
    reward: {
      icon: '🎁',
      text: 'Year One badge + special On This Day compilation',
    },
  },
  // Legacy milestones for backward compatibility
  {
    type: 'first_entry',
    message: "You've started your musical journey!",
    icon: '🎵',
    headline: "You've started your musical journey!",
    body: "Your first song is logged. The journey begins!",
    check: (entryCount: number, daysSinceFirst: number, currentStreak: number) => entryCount >= 1,
    reward: null,
  },
]

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prismaUserId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!prismaUserId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Get today parameter from client (local timezone)
    const { searchParams } = new URL(request.url)
    const todayParam = searchParams.get('today')
    
    // Parse today date (YYYY-MM-DD format from client)
    const todayDateStr = todayParam || new Date().toISOString().split('T')[0]
    const [todayYear, todayMonth, todayDay] = todayDateStr.split('-').map(Number)
    const today = new Date(todayYear, todayMonth - 1, todayDay, 0, 0, 0, 0)

    const supabase = getSupabase()

    // Fetch all entries for this user
    const { data: entries, error } = await supabase
      .from('entries')
      .select('date')
      .eq('userId', prismaUserId)
      .order('date', { ascending: true })

    if (error) {
      throw error
    }

    const entryCount = entries?.length || 0
    const entryDates = (entries || []).map(e => {
      const entryDate = new Date(e.date)
      // Normalize to local midnight
      return new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate(), 0, 0, 0, 0).getTime()
    })
    
    // Calculate days since first entry
    let daysSinceFirst = 0
    if (entryDates.length > 0) {
      const firstEntryDate = Math.min(...entryDates)
      const daysDiff = Math.floor((today.getTime() - firstEntryDate) / (1000 * 60 * 60 * 24)) + 1
      daysSinceFirst = Math.max(0, daysDiff)
    }

    // Get current streak
    const { data: streakData } = await supabase
      .from('users')
      .select('currentStreak')
      .eq('id', prismaUserId)
      .single()

    const currentStreak = streakData?.currentStreak || 0

    // Check each milestone
    const milestones: Milestone[] = []
    let nextMilestone: Milestone | null = null

    for (const def of milestoneDefinitions) {
      const achieved = def.check(entryCount, daysSinceFirst, currentStreak)
      
      if (achieved) {
        // Find when this milestone was achieved
        let achievedDate: string | undefined
        if (def.type === 'first_entry' && entryDates.length > 0) {
          achievedDate = new Date(Math.min(...entryDates)).toISOString().split('T')[0]
        } else if (def.type.startsWith('streak_')) {
          // For streak milestones, calculate when streak reached target
          const targetStreak = parseInt(def.type.split('_')[1] || '0')
          if (entryDates.length > 0 && currentStreak >= targetStreak) {
            // Find the date when streak reached this target
            const sortedDates = [...entryDates].sort((a, b) => b - a) // Most recent first
            let streakCount = 0
            let lastDate = new Date().setHours(0, 0, 0, 0)
            
            for (const date of sortedDates) {
              const entryDate = new Date(date).setHours(0, 0, 0, 0)
              const daysDiff = Math.floor((lastDate - entryDate) / (1000 * 60 * 60 * 24))
              
              if (daysDiff === 0 || daysDiff === 1) {
                streakCount++
                if (streakCount === targetStreak) {
                  achievedDate = new Date(date).toISOString().split('T')[0]
                  break
                }
                lastDate = entryDate
              } else {
                break
              }
            }
          }
        } else {
          // For entry count milestones, find when the target count was reached
          const targetCount = parseInt(def.type.split('_')[1] || '0')
          if (entryDates.length >= targetCount) {
            const sortedDates = [...entryDates].sort((a, b) => a - b)
            const targetIndex = targetCount - 1
            if (sortedDates[targetIndex]) {
              achievedDate = new Date(sortedDates[targetIndex]).toISOString().split('T')[0]
            }
          }
        }

        milestones.push({
          type: def.type,
          message: def.message,
          achieved: true,
          achievedDate,
          icon: def.icon,
          headline: def.headline,
          body: def.body,
          reward: def.reward,
        })
      } else if (!nextMilestone) {
        // This is the next milestone to achieve
        let progress: { current: number; target: number; message: string } | undefined
        
        if (def.type === 'first_entry') {
          progress = {
            current: entryCount,
            target: 1,
            message: entryCount === 0 ? 'Log your first song to start your journey!' : 'Almost there!',
          }
        } else if (def.type.startsWith('streak_')) {
          const targetStreak = parseInt(def.type.split('_')[1] || '0')
          const remaining = Math.max(0, targetStreak - currentStreak)
          progress = {
            current: currentStreak,
            target: targetStreak,
            message: remaining > 0 
              ? `${remaining} more ${remaining === 1 ? 'day' : 'days'} to reach ${targetStreak} day streak!`
              : 'Almost there!',
          }
        } else {
          const targetCount = parseInt(def.type.split('_')[1] || '0')
          const remaining = Math.max(0, targetCount - entryCount)
          progress = {
            current: entryCount,
            target: targetCount,
            message: remaining > 0 
              ? `${remaining} more ${remaining === 1 ? 'entry' : 'entries'} to go!`
              : 'Almost there!',
          }
        }

        nextMilestone = {
          type: def.type,
          message: def.message,
          achieved: false,
          progress,
          icon: def.icon,
          headline: def.headline,
          body: def.body,
          reward: def.reward,
        }
      }
    }

    return NextResponse.json({
      milestones,
      nextMilestone,
      stats: {
        entryCount,
        daysSinceFirst,
      },
    })
  } catch (error: any) {
    console.error('[milestones] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch milestones', message: error?.message },
      { status: 500 }
    )
  }
}

