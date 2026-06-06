import { getDb } from '@/db'
import { categories, tests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { TestsClient } from '@/components/admin/TestsClient'

export const dynamic = 'force-dynamic'

export default async function TestsPage() {
  let categoriesData: any[] = []
  try {
    const db = await getDb()

    categoriesData = await db.query.categories.findMany({
      where: eq(categories.active, true),
      orderBy: (categories, { asc }) => [asc(categories.code)],
      with: {
        tests: {
          where: eq(tests.active, true),
          orderBy: (tests, { asc }) => [asc(tests.name)],
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tests</h1>
        <p className="text-gray-600 mt-2">Manage tests under each category</p>
      </div>

      <TestsClient initialCategories={categoriesData} />
    </div>
  )
}
