import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { getBirdUnlockStatuses } from '@/lib/birds'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const statuses = await getBirdUnlockStatuses(userId)
    
    return NextResponse.json({ 
      birds: statuses,
      unlockedCount: statuses.filter(s => s.isUnlocked).length,
      totalCount: statuses.length,
    })
  } catch (error: any) {
    console.error('[birds/status] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to get bird statuses' },
      { status: 500 }
    )
  }
}



