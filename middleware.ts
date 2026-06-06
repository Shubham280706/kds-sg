import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type UserRole = 'admin' | 'front_desk' | 'analyst' | 'reviewer' | 'signatory'

interface RouteConfig {
  path: string
  requiredRoles: UserRole[]
}

const PROTECTED_ROUTES: RouteConfig[] = [
  // Admin only
  { path: '/admin', requiredRoles: ['admin'] },

  // Sample intake - front_desk or admin
  { path: '/samples/inward', requiredRoles: ['admin', 'front_desk'] },

  // Sample assignment - admin
  { path: '/samples', requiredRoles: ['admin'] },

  // Analyst queue - analyst or admin
  { path: '/analyst/queue', requiredRoles: ['admin', 'analyst'] },

  // Reviewer queue - reviewer or admin
  { path: '/reviewer/queue', requiredRoles: ['admin', 'reviewer'] },

  // Signatory queue - signatory or admin
  { path: '/signatory/queue', requiredRoles: ['admin', 'signatory'] },

  // Dashboard - anyone authenticated
  { path: '/dashboard', requiredRoles: ['admin', 'front_desk', 'analyst', 'reviewer', 'signatory'] },
]

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
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
    '/signatory/:path*',
  ],
}
