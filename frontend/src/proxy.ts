import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the request is for admin routes
  if (pathname.startsWith('/admin')) {
    // Skip proxy for login page and static assets
    if (pathname === '/admin/login' || 
        pathname.startsWith('/auth/admin/login') ||
        pathname.includes('/_next/') ||
        pathname.includes('/favicon.ico') ||
        pathname.includes('.css') ||
        pathname.includes('.js') ||
        pathname.includes('.png') ||
        pathname.includes('.jpg') ||
        pathname.includes('.svg')) {
      return NextResponse.next()
    }

    // Check for admin token in cookies
    const adminToken = request.cookies.get('admin_user_access_token')?.value

    // If no token, redirect to login
    if (!adminToken) {
      console.log(`[Proxy] No admin token found for ${pathname}, redirecting to login`)
      const loginUrl = new URL('/auth/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Add security headers for admin routes
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}