import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that do not require auth
  const publicPaths = ['/', '/login', '/signup', '/api/auth/login', '/api/auth/register', '/api/auth/demo']
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico'))

  if (isPublic) {
    return NextResponse.next()
  }

  const token = request.cookies.get('daybudget_token')?.value

  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/expenses') || 
                 pathname.startsWith('/bank') || pathname.startsWith('/analytics') || 
                 pathname.startsWith('/goals') || pathname.startsWith('/settings') ||
                 pathname.startsWith('/onboarding'))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
