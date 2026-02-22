import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/home(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/join/(.*)',
  '/waitlist(.*)',
  '/api/webhooks(.*)',
  '/api/invites/validate(.*)',
  '/api/waitlist(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const isPublic = isPublicRoute(req)
  
  // If user is not authenticated and trying to access a protected route
  if (!userId && !isPublic) {
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
