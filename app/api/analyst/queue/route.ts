import { auth } from '@/auth/authOptions'
import { getDb } from '@/db'
import { sampleTests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt((session.user as any).id, 10)
    const db = await getDb()

    const tests = await db.query.sampleTests.findMany({
      where: eq(sampleTests.assignedTo, userId),
      with: {
        test: true,
        sample: true,
      },
    })

    return NextResponse.json({ tests })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
