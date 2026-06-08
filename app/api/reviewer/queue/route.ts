import { getDb } from '@/db'
import { samples } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDb()
    const data = await db.query.samples.findMany({
      where: eq(samples.status, 'under_review'),
      with: { sampleTests: { with: { test: true } } },
    })
    return NextResponse.json({ samples: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
