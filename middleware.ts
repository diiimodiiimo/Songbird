import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/home(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/join/(.*)',
  '/waitlist(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/help(.*)',
  '/api/webhooks(.*)',
  '/api/invites/validate(.*)',
  '/api/waitlist(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const isPublic = isPublicRoute(req)
  
  // If user is not authenticated and trying to access a protected route
  if (!userId && !isPublic) {
    // API clients (web fetch, mobile app) need a JSON 401, not an HTML redirect
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const waitlistEnabled = process.env.WAITLIST_MODE_ENABLED === 'true'
    const hasInviteCode = req.nextUrl.searchParams.has('invite')
    
    if (waitlistEnabled && !hasInviteCode) {
      const waitlistUrl = new URL('/waitlist', req.url)
      return NextResponse.redirect(waitlistUrl)
    } else {
      const homeUrl = new URL('/home', req.url)
      if (hasInviteCode) {
        homeUrl.searchParams.set('invite', req.nextUrl.searchParams.get('invite')!)
      }
      return NextResponse.redirect(homeUrl)
    }
  }
  
  // Don't auto-redirect from /home - let user choose to sign in/out
  // if (userId && req.nextUrl.pathname === '/home') {
  //   const dashboardUrl = new URL('/', req.url)
  //   return NextResponse.redirect(dashboardUrl)
  // }
})

export const config = {
  matcher: [
    // Skip static assets: Next internals, favicon, images/video, and
    // root-level PWA files (manifest.json, sw.js) which must never be
    // redirected to HTML
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
}
