import { getDb } from '@/db'
import { categories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { CategoriesClient } from '@/components/admin/CategoriesClient'

export default async function CategoriesPage() {
  const db = await getDb()
  const data = await db.query.categories.findMany({
    where: eq(categories.active, true),
    orderBy: (categories, { asc }) => [asc(categories.code)],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-600 mt-2">Manage sample categories and their default TAT</p>
      </div>

      <CategoriesClient initialData={data} />
    </div>
  )
}
