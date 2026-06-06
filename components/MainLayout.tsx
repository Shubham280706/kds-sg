'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-gray-900 text-white">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold">KDS Lab</h1>
          <p className="text-xs text-gray-400 mt-1">Sample Tracking</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-100"
          >
            📊 KDS Board
          </Link>

          <Link
            href="/samples"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-100"
          >
            📋 Samples
          </Link>

          {['admin', 'front_desk'].includes(session.user?.role as string) && (
            <Link
              href="/samples/inward"
              className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-100"
            >
              + Register Sample
            </Link>
          )}

          {['admin', 'analyst'].includes(session.user?.role as string) && (
            <Link
              href="/analyst/queue"
              className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-100"
            >
              🧪 My Queue
            </Link>
          )}

          {['admin', 'reviewer'].includes(session.user?.role as string) && (
            <Link
              href="/reviewer/queue"
              className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-100"
            >
              ✓ Review Queue
            </Link>
          )}

          {['admin', 'signatory'].includes(session.user?.role as string) && (
            <Link
              href="/signatory/queue"
              className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-100"
            >
              ✍️ Sign-off
            </Link>
          )}

          {isAdmin && (
            <>
              <div className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-2 px-4">
                Admin
              </div>
              <Link
                href="/admin/users"
                className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-100"
              >
                Users
              </Link>
              <Link
                href="/admin/categories"
                className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-100"
              >
                Categories
              </Link>
              <Link
                href="/admin/tests"
                className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-100"
              >
                Tests
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-400 mb-3">
            <p className="font-semibold text-gray-200">{session.user?.name}</p>
            <p className="text-gray-500">{session.user?.email}</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => signOut({ redirect: true, callbackUrl: '/auth/signin' })}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">KDS Lab</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-800 text-white p-4 space-y-2">
            <Link href="/dashboard" className="block px-4 py-2 rounded hover:bg-gray-700">
              📊 KDS Board
            </Link>
            <Link href="/samples" className="block px-4 py-2 rounded hover:bg-gray-700">
              📋 Samples
            </Link>
            {['admin', 'front_desk'].includes(session.user?.role as string) && (
              <Link href="/samples/inward" className="block px-4 py-2 rounded hover:bg-gray-700">
                + Register
              </Link>
            )}
            {['admin', 'analyst'].includes(session.user?.role as string) && (
              <Link href="/analyst/queue" className="block px-4 py-2 rounded hover:bg-gray-700">
                🧪 My Queue
              </Link>
            )}
            {['admin', 'reviewer'].includes(session.user?.role as string) && (
              <Link href="/reviewer/queue" className="block px-4 py-2 rounded hover:bg-gray-700">
                ✓ Review
              </Link>
            )}
            {['admin', 'signatory'].includes(session.user?.role as string) && (
              <Link href="/signatory/queue" className="block px-4 py-2 rounded hover:bg-gray-700">
                ✍️ Sign-off
              </Link>
            )}
            {isAdmin && (
              <>
                <Link href="/admin/users" className="block px-4 py-2 rounded hover:bg-gray-700">
                  Users
                </Link>
                <Link href="/admin/categories" className="block px-4 py-2 rounded hover:bg-gray-700">
                  Categories
                </Link>
                <Link href="/admin/tests" className="block px-4 py-2 rounded hover:bg-gray-700">
                  Tests
                </Link>
              </>
            )}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
