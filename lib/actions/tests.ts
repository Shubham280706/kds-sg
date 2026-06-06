'use server'

import { getDb } from '@/db'
import { tests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth/authOptions'

async function checkAdminPermission() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }
}

export async function createTest(data: {
  categoryId: number
  name: string
  unit: string
  defaultMethod?: string
}) {
  try {
    await checkAdminPermission()

    const db = await getDb()
    const result = await db.insert(tests).values({
      categoryId: data.categoryId,
      name: data.name,
      unit: data.unit,
      defaultMethod: data.defaultMethod || null,
    })

    return { success: true, id: result[0].insertId }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create test' }
  }
}

export async function updateTest(
  id: number,
  data: {
    name: string
    unit: string
    defaultMethod?: string
  }
) {
  try {
    await checkAdminPermission()

    const db = await getDb()
    await db
      .update(tests)
      .set({
        name: data.name,
        unit: data.unit,
        defaultMethod: data.defaultMethod || null,
      })
      .where(eq(tests.id, id))

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update test' }
  }
}

export async function deleteTest(id: number) {
  try {
    await checkAdminPermission()

    const db = await getDb()
    await db
      .update(tests)
      .set({ active: false })
      .where(eq(tests.id, id))

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete test' }
  }
}

export async function getTestsByCategory(categoryId: number) {
  try {
    const db = await getDb()
    const result = await db.query.tests.findMany({
      where: (tests, { eq: dbEq, and }) =>
        and(dbEq(tests.categoryId, categoryId), dbEq(tests.active, true)),
      orderBy: (tests, { asc }) => [asc(tests.name)],
    })
    return result
  } catch (error: any) {
    throw new Error('Failed to fetch tests')
  }
}
