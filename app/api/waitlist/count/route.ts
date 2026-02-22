import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabase()

    const { count, error } = await supabase
      .from('waitlist_entries')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('[waitlist/count] Error:', error)
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('[waitlist/count] Error:', error)
    return NextResponse.json({ count: 0 })
  }
}
