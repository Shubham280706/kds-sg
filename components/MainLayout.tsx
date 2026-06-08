'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) {
    return null
  }

  const isAdmin = session.user?.role === 'admin'

  const isActive = (href: string) => {
    // Exact match for /samples/inward
    if (href === '/samples/inward') {
      return pathname === href || pathname.startsWith(href + '/')
    }
    // Exact match for /samples (but not /samples/inward)
    if (href === '/samples') {
      return pathname === href
    }
    // Default: exact match or start with href/
    return pathname === href || pathname.startsWith(href + '/')
  }

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const active = isActive(href)
    return (
      <Link href={href}>
        <div
          className={`px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer group ${
            active
              ? 'bg-blue-600 text-white border-l-4 border-blue-400'
              : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          <span className="text-sm font-medium">{label}</span>
        </div>
      </Link>
    )
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-60 bg-gradient-to-b from-gray-900 to-gray-950 text-white border-r border-gray-800">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-tight mb-1">KDS Lab</h1>
          <p className="text-xs text-gray-500">Sample Tracking System</p>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4 px-3">
            Workspace
          </div>

          <NavLink href="/dashboard" label="KDS Board" />
          <NavLink href="/samples" label="Samples" />
          <NavLink href="/samples/inward" label="Register Sample" />

          {['analyst', 'admin'].includes(session?.user?.role || '') && (
            <NavLink href="/analyst/queue" label="My Queue" />
          )}

          {/* Reviewer Section */}
          {['reviewer', 'admin'].includes(session?.user?.role || '') && (
            <>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-widest my-4 px-3 pt-2 border-t border-gray-800">
                Reviewer
              </div>
              <NavLink href="/reviewer/dashboard" label="Review Dashboard" />
              <NavLink href="/reviewer/queue" label="Review Queue" />
              <NavLink href="/reviewer/reviews" label="My Reviews" />
            </>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-widest my-4 px-3 pt-2 border-t border-gray-800">
                Admin
              </div>
              <NavLink href="/admin/users" label="Users" />
              <NavLink href="/admin/categories" label="Categories" />
              <NavLink href="/admin/tests" label="Tests" />
            </>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="px-4 py-4 border-t border-gray-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
              {getInitials(session.user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-100 truncate">{session.user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/auth/signin' })}
            className="w-full px-3 py-2 text-sm font-medium text-red-400 border border-red-900/50 rounded-lg hover:bg-red-950/20 transition-all duration-150"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-gradient-to-r from-gray-900 to-gray-950 text-white p-4 flex justify-between items-center border-b border-gray-800">
          <h1 className="text-lg font-bold">KDS Lab</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:text-gray-300"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-900 text-white p-4 space-y-1 border-b border-gray-800">
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded hover:bg-gray-800 transition-all"
            >
              KDS Board
            </Link>
            <Link href="/samples" className="block px-3 py-2 rounded hover:bg-gray-800 transition-all">
              Samples
            </Link>
            <Link
              href="/samples/inward"
              className="block px-3 py-2 rounded hover:bg-gray-800 transition-all"
            >
              Register Sample
            </Link>
            <Link
              href="/analyst/queue"
              className="block px-3 py-2 rounded hover:bg-gray-800 transition-all"
            >
              My Queue
            </Link>
            {isAdmin && (
              <>
                <div className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-2 px-3">
                  Admin
                </div>
                <Link
                  href="/admin/users"
                  className="block px-3 py-2 rounded hover:bg-gray-800 transition-all"
                >
                  Users
                </Link>
                <Link
                  href="/admin/categories"
                  className="block px-3 py-2 rounded hover:bg-gray-800 transition-all"
                >
                  Categories
                </Link>
                <Link
                  href="/admin/tests"
                  className="block px-3 py-2 rounded hover:bg-gray-800 transition-all"
                >
                  Tests
                </Link>
              </>
            )}
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
