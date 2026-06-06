import { getDb } from '@/db'
import { categories, tests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { TestsClient } from '@/components/admin/TestsClient'

export default async function TestsPage() {
  const db = await getDb()

  const categoriesData = await db.query.categories.findMany({
    where: eq(categories.active, true),
    orderBy: (categories, { asc }) => [asc(categories.code)],
    with: {
      tests: {
        where: eq(tests.active, true),
        orderBy: (tests, { asc }) => [asc(tests.name)],
      },
    },
  })

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
