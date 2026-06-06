'use server'

import { getDb } from '@/db'
import { categories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth/authOptions'

async function checkAdminPermission() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }
}

export async function createCategory(data: {
  code: string
  name: string
  defaultTatHours: number
  color: string
}) {
  try {
    await checkAdminPermission()

    const db = await getDb()
    const result = await db.insert(categories).values({
      code: data.code.toUpperCase(),
      name: data.name,
      defaultTatHours: data.defaultTatHours,
      color: data.color,
    })

    return { success: true, id: result[0].insertId }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create category' }
  }
}

export async function updateCategory(id: number, data: {
  code: string
  name: string
  defaultTatHours: number
  color: string
}) {
  try {
    await checkAdminPermission()

    const db = await getDb()
    await db
      .update(categories)
      .set({
        code: data.code.toUpperCase(),
        name: data.name,
        defaultTatHours: data.defaultTatHours,
        color: data.color,
      })
      .where(eq(categories.id, id))

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update category' }
  }
}

export async function deleteCategory(id: number) {
  try {
    await checkAdminPermission()

    const db = await getDb()
    await db
      .update(categories)
      .set({ active: false })
      .where(eq(categories.id, id))

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete category' }
  }
}

export async function getCategories() {
  try {
    const db = await getDb()
    const result = await db.query.categories.findMany({
      where: eq(categories.active, true),
      orderBy: (categories, { asc }) => [asc(categories.code)],
    })
    return result
  } catch (error: any) {
    throw new Error('Failed to fetch categories')
  }
}
