import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/home(.*)',
  '/welcome(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const isPublic = isPublicRoute(req)
  
  // If user is not authenticated and trying to access a protected route
  if (!userId && !isPublic) {
    // Redirect to home page for sign in/sign up
    const homeUrl = new URL('/home', req.url)
    return NextResponse.redirect(homeUrl)
  }
  
  // Redirect authenticated users from /home to dashboard
  if (userId && req.nextUrl.pathname === '/home') {
    const dashboardUrl = new URL('/', req.url)
    return NextResponse.redirect(dashboardUrl)
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
