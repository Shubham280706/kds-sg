import { getDb } from '@/db'
import { categories, tests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { TestsClient } from '@/components/admin/TestsClient'

export const dynamic = 'force-dynamic'

export default async function TestsPage() {
  let testsData: any[] = []
  let categoriesData: any[] = []
  try {
    const db = await getDb()

    const [testsResult, categoriesResult] = await Promise.all([
      db.query.tests.findMany({
        where: eq(tests.active, true),
        orderBy: (tests, { asc }) => [asc(tests.name)],
      }),
      db.query.categories.findMany({
        where: eq(categories.active, true),
        orderBy: (categories, { asc }) => [asc(categories.code)],
      }),
    ])

    testsData = testsResult
    categoriesData = categoriesResult
  } catch (error) {
    console.error('Failed to fetch tests:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tests</h1>
        <p className="text-gray-600 mt-2">Manage all available tests</p>
      </div>

      <TestsClient initialTests={testsData} initialCategories={categoriesData} />
    </div>
  )
}
