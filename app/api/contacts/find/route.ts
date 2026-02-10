import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { getFriendIds } from '@/lib/friends'

// POST - Find users by phone numbers (for contact discovery)
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const { phoneNumbers } = body

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Normalize phone numbers for matching
    // Handles various formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
    const normalizePhone = (phone: string): string[] => {
      if (!phone) return []
      
      // Remove all non-digit characters except +
      let cleaned = phone.replace(/[^\d+]/g, '')
      
      // If it starts with +, keep it
      if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1)
      }
      
      // Remove leading 1 if it's a US number (11 digits starting with 1)
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = cleaned.substring(1)
      }
      
      // Return multiple formats for better matching
      const results: string[] = []
      
      // Format 1: E.164 with country code (+1XXXXXXXXXX)
      if (cleaned.length === 10) {
        results.push('+1' + cleaned)
      } else if (cleaned.length > 10) {
        results.push('+' + cleaned)
      }
      
      // Format 2: Just the digits (for users who stored without +)
      if (cleaned.length >= 10) {
        results.push(cleaned)
      }
      
      return results
    }
    
    // Create a set of all normalized phone number variations
    const phoneSet = new Set<string>()
    phoneNumbers.forEach(phone => {
      const normalized = normalizePhone(phone)
      normalized.forEach(p => phoneSet.add(p))
    })
    
    const phoneList = Array.from(phoneSet).slice(0, 200) // Increased limit for variations

    if (phoneList.length === 0) {
      return NextResponse.json({ users: [] })
    }

    const supabase = getSupabase()

    // Find users with matching phone numbers
    const { data: matchedUsers, error } = await supabase
      .from('users')
      .select('id, email, phone, name, username, image, theme')
      .in('phone', phoneList)
      .neq('id', userId) // Exclude current user

    if (error) {
      console.error('[contacts] Error finding users:', error)
      return NextResponse.json({ error: 'Failed to find users', message: error.message }, { status: 500 })
    }

    if (!matchedUsers || matchedUsers.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Get current user's friends and friend requests
    const friendIds = await getFriendIds(userId)
    
    // Get pending friend requests
    const { data: friendRequests } = await supabase
      .from('friend_requests')
      .select('senderId, receiverId, status')
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`)

    const friendRequestMap = new Map<string, { status: string; direction: 'sent' | 'received' }>()
    friendRequests?.forEach(req => {
      const otherUserId = req.senderId === userId ? req.receiverId : req.senderId
      friendRequestMap.set(otherUserId, {
        status: req.status,
        direction: req.senderId === userId ? 'sent' : 'received'
      })
    })

    // Enrich users with friendship status
    const enrichedUsers = matchedUsers.map(user => {
      const isFriend = friendIds.includes(user.id)
      const requestInfo = friendRequestMap.get(user.id)
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username || user.name || user.email.split('@')[0],
        image: user.image && !user.image.startsWith('data:') ? user.image : undefined,
        theme: user.theme || 'american-robin',
        isFriend,
        hasPendingRequest: requestInfo?.status === 'pending',
        requestDirection: requestInfo?.direction || null,
      }
    })

    return NextResponse.json({ users: enrichedUsers })
  } catch (error: any) {
    console.error('[contacts] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to find contacts', message: error?.message },
      { status: 500 }
    )
  }
}

