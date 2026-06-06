import { getDb } from '@/db'
import { tests } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categoryId = parseInt(id, 10)
    const db = await getDb()

    const categoryTests = await db.query.tests.findMany({
      where: and(eq(tests.categoryId, categoryId), eq(tests.active, true)),
    })

    return NextResponse.json({ tests: categoryTests })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
