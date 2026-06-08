import { getDb } from '@/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDb()
    const data = await db.query.samples.findMany({
      with: { category: true },
      orderBy: (samples, { desc }) => [desc(samples.createdAt)],
    })
    return NextResponse.json({ samples: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
