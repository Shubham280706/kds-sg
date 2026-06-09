import { getDb } from '@/db'
import { tests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDb()
    const allTests = await db.query.tests.findMany({
      where: eq(tests.active, true),
      orderBy: (tests, { asc }) => [asc(tests.name)],
    })
    return NextResponse.json({ success: true, tests: allTests })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
