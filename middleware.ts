import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type UserRole = 'admin' | 'analyst' | 'reviewer'

interface RouteConfig {
  path: string
  requiredRoles: UserRole[]
}

const PROTECTED_ROUTES: RouteConfig[] = [
  // Admin only - master data
  { path: '/admin', requiredRoles: ['admin'] },

  // Sample intake and viewing - admin and reviewer only
  { path: '/samples/inward', requiredRoles: ['admin', 'reviewer'] },
  { path: '/samples', requiredRoles: ['admin', 'reviewer'] },

  // Analyst queue - admin and analyst only
  { path: '/analyst/queue', requiredRoles: ['admin', 'analyst'] },

  // Reviewer - admin and reviewer
  { path: '/reviewer', requiredRoles: ['admin', 'reviewer'] },

  // Dashboard - all roles
  { path: '/dashboard', requiredRoles: ['admin', 'analyst', 'reviewer'] },
]

export async function middleware(request: NextRequest) {
  // ✅ New - looks for NextAuth v5 cookie name
const token = await getToken({ 
  req: request, 
  secret: process.env.NEXTAUTH_SECRET,
  cookieName: process.env.NODE_ENV === 'production' 
    ? '__Secure-authjs.session-token' 
    : 'authjs.session-token'
})
  const path = request.nextUrl.pathname

  // Check all protected routes
  for (const route of PROTECTED_ROUTES) {
    if (path.startsWith(route.path)) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', request.url))
      }

      const userRole = token.role as UserRole
      if (!route.requiredRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/samples/:path*',
    '/analyst/:path*',
    '/reviewer/:path*',
  ],
}
