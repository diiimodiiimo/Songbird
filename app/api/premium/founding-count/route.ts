import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabase()
    
    // Count founding members
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('isFoundingMember', true)

    if (error) {
      console.error('Error counting founding members:', error)
      // Return a placeholder count if there's an error
      return NextResponse.json({ count: 127 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Error in founding-count API:', error)
    // Return a placeholder count on error
    return NextResponse.json({ count: 127 })
  }
}


