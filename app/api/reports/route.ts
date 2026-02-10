import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getUserIdFromClerk } from '@/lib/clerk-sync'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'

const reportSchema = z.object({
  reportedUsername: z.string().optional(),
  reportedEntryId: z.string().optional(),
  reportedCommentId: z.string().optional(),
  type: z.enum(['user', 'entry', 'comment']),
  reason: z.enum(['harassment', 'spam', 'inappropriate', 'other']),
  description: z.string().optional(),
})

// Simple ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

// POST - Create a report
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(clerkUserId, 'WRITE')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reporterId = await getUserIdFromClerk(clerkUserId)
    if (!reporterId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const data = reportSchema.parse(body)

    const supabase = getSupabase()

    // Validate based on report type
    let reportedUserId: string | null = null

    if (data.type === 'user') {
      if (!data.reportedUsername) {
        return NextResponse.json({ error: 'Username required for user reports' }, { status: 400 })
      }

      const { data: reportedUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', data.reportedUsername)
        .single()

      if (!reportedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (reportedUser.id === reporterId) {
        return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
      }

      reportedUserId = reportedUser.id
    } else if (data.type === 'entry') {
      if (!data.reportedEntryId) {
        return NextResponse.json({ error: 'Entry ID required for entry reports' }, { status: 400 })
      }

      // Get entry owner
      const { data: entry } = await supabase
        .from('entries')
        .select('userId')
        .eq('id', data.reportedEntryId)
        .single()

      if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
      }

      reportedUserId = entry.userId
    } else if (data.type === 'comment') {
      if (!data.reportedCommentId) {
        return NextResponse.json({ error: 'Comment ID required for comment reports' }, { status: 400 })
      }

      // Get comment owner
      const { data: comment } = await supabase
        .from('comments')
        .select('userId')
        .eq('id', data.reportedCommentId)
        .single()

      if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }

      reportedUserId = comment.userId
    }

    // Create report
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        id: generateId(),
        reporterId,
        reportedUserId,
        reportedEntryId: data.reportedEntryId || null,
        reportedCommentId: data.reportedCommentId || null,
        type: data.type,
        reason: data.reason,
        description: data.description || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[report] Error:', error)
      throw error
    }

    return NextResponse.json({ success: true, reportId: report.id }, {
      headers: await getRateLimitHeaders(clerkUserId, 'WRITE'),
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[report] POST Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to create report', message: error?.message },
      { status: 500 }
    )
  }
}

// GET - Get reports (admin only - for now returns empty, can be implemented later)
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return empty - admin functionality can be added later
    return NextResponse.json({ reports: [] })
  } catch (error: any) {
    console.error('[report] GET Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch reports', message: error?.message },
      { status: 500 }
    )
  }
}


