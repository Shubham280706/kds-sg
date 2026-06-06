import { getDb } from '@/db'
import { categories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const db = await getDb()
    const data = await db.query.categories.findMany({
      where: eq(categories.active, true),
    })
    return NextResponse.json({ categories: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
