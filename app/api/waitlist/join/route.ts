import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const joinWaitlistSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional(),
  referralCode: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, source, referralCode } = joinWaitlistSchema.parse(body)

    const supabase = getSupabase()

    // Check if email already exists in waitlist
    const { data: existing } = await supabase
      .from('waitlist_entries')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { 
          message: 'You\'re already on the waitlist!',
          position: await getWaitlistPosition(email),
        },
        { status: 200 }
      )
    }

    // Get source from URL params if not provided
    const url = new URL(request.url)
    const urlSource = url.searchParams.get('source') || url.searchParams.get('utm_source')
    const finalSource = source || urlSource || null

    // Insert new waitlist entry
    const { data: entry, error } = await supabase
      .from('waitlist_entries')
      .insert({
        id: uuidv4(),
        email,
        name: name || null,
        source: finalSource,
        referralCode: referralCode || null,
        joinedAt: new Date().toISOString(),
        foundingFlockEligible: false,
      })
      .select()
      .single()

    if (error) {
      console.error('[waitlist/join] Error:', error)
      return NextResponse.json(
        { error: 'Failed to join waitlist', message: error.message },
        { status: 500 }
      )
    }

    // Get position in waitlist
    const position = await getWaitlistPosition(email)

    return NextResponse.json({
      success: true,
      message: 'Successfully joined waitlist!',
      position,
      entry,
    }, { status: 201 })
  } catch (error: any) {
    console.error('[waitlist/join] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to join waitlist', message: error?.message },
      { status: 500 }
    )
  }
}

async function getWaitlistPosition(email: string): Promise<number> {
  const supabase = getSupabase()
  
  // Get count of entries before this email (by joinedAt)
  const { data: entry } = await supabase
    .from('waitlist_entries')
    .select('joinedAt')
    .eq('email', email)
    .single()

  if (!entry) return 0

  const { count } = await supabase
    .from('waitlist_entries')
    .select('*', { count: 'exact', head: true })
    .lte('joinedAt', entry.joinedAt)

  return count || 0
}
