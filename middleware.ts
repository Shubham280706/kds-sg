import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type UserRole = 'admin' | 'analyst'

interface RouteConfig {
  path: string
  requiredRoles: UserRole[]
}

const PROTECTED_ROUTES: RouteConfig[] = [
  // Admin only - master data
  { path: '/admin', requiredRoles: ['admin'] },

  // Sample intake, assignment, queue - both roles
  { path: '/samples/inward', requiredRoles: ['admin', 'analyst'] },
  { path: '/samples', requiredRoles: ['admin', 'analyst'] },
  { path: '/analyst/queue', requiredRoles: ['admin', 'analyst'] },

  // Dashboard - both roles
  { path: '/dashboard', requiredRoles: ['admin', 'analyst'] },
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
  ],
}
