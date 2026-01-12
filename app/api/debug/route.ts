import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase, getSupabase } from '@/lib/supabase'

/**
 * Debug endpoint to test database connection and auth
 * Visit /api/debug to see connection status
 */
export async function GET() {
  const startTime = Date.now()
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  }

  // Test 1: Check environment variables
  results.env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (hidden)' : 'NOT SET',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? 'SET (hidden)' : 'NOT SET',
  }

  // Test 2: Check Supabase client
  results.supabaseClient = supabase ? 'INITIALIZED' : 'NOT INITIALIZED'

  // Test 3: Test Supabase connection
  try {
    const sb = getSupabase()
    const queryStart = Date.now()
    const { data, error } = await sb
      .from('users')
      .select('id')
      .limit(1)
    
    results.supabaseConnection = {
      status: error ? 'ERROR' : 'SUCCESS',
      latency: `${Date.now() - queryStart}ms`,
      error: error?.message || null,
      foundUser: !!data && data.length > 0,
    }
  } catch (error: any) {
    results.supabaseConnection = {
      status: 'EXCEPTION',
      error: error?.message || 'Unknown error',
    }
  }

  // Test 4: Check Clerk auth
  try {
    const { userId } = await auth()
    results.clerkAuth = {
      status: userId ? 'AUTHENTICATED' : 'NOT AUTHENTICATED',
      userId: userId || null,
    }
  } catch (error: any) {
    results.clerkAuth = {
      status: 'ERROR',
      error: error?.message || 'Unknown error',
    }
  }

  // Test 5: Count entries (if connected)
  if (results.supabaseConnection?.status === 'SUCCESS') {
    try {
      const sb = getSupabase()
      const { count } = await sb
        .from('entries')
        .select('id', { count: 'exact', head: true })
      
      results.entriesCount = count || 0
    } catch (error: any) {
      results.entriesCount = `ERROR: ${error?.message}`
    }
  }

  results.totalTime = `${Date.now() - startTime}ms`

  return NextResponse.json(results)
}
