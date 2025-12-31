import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow all requests for now - we'll add auth later
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|auth|_next/static|_next/image|favicon.ico).*)'],
}

