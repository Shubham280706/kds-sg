import { auth } from '@/auth/authOptions'
import { getDb } from '@/db'
import { sampleTests, statusEvents } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
        sample: {
          with: {
            category: true,
            statusEvents: {
              where: and(
                eq(statusEvents.fromStatus, 'under_review' as any),
                eq(statusEvents.toStatus, 'in_analysis' as any)
              ),
              orderBy: (se, { desc }) => [desc(se.createdAt)],
              limit: 1,
            },
          },
        },
      },
    })

    // Map tests to include revision reason
    const testsWithRevisions = tests.map((test) => ({
      ...test,
      revisionReason: test.sample?.statusEvents?.[0]?.note || null,
    }))

    return NextResponse.json({ tests: testsWithRevisions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
