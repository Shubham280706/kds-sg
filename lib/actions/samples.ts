'use server'

import { getDb } from '@/db'
import { samples, sampleTests, statusEvents, tests, categories } from '@/db/schema'
import { eq, and, gte, like, desc } from 'drizzle-orm'
import { auth } from '@/auth/authOptions'

// ===== Helpers =====

async function checkAuth(requiredRoles?: string[]) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized: Not authenticated')
  }
  const userRole = (session.user as any).role
  if (requiredRoles && !requiredRoles.includes(userRole)) {
    throw new Error(`Unauthorized: Role ${userRole} not allowed`)
  }
  return { userId: (session.user as any).id, userRole, email: session.user.email }
}

async function generateSampleId(): Promise<string> {
  const db = await getDb()
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  // Find max sequence for today
  const maxSeq = await db.query.samples.findFirst({
    where: (samples, { like }) => like(samples.sampleCode, `SG/${dateStr}/%`),
    orderBy: (samples, { desc }) => [desc(samples.sampleCode)],
  })

  let seq = 1
  if (maxSeq && maxSeq.sampleCode) {
    const parts = maxSeq.sampleCode.split('/')
    const lastSeq = parseInt(parts[2] || '0', 10)
    seq = lastSeq + 1
  }

  return `SG/${dateStr}/${String(seq).padStart(3, '0')}`
}

async function writeStatusEvent(sampleId: number, fromStatus: string, toStatus: string, userId: string, note?: string) {
  const db = await getDb()
  await db.insert(statusEvents).values({
    sampleId,
    fromStatus,
    toStatus,
    byUser: parseInt(userId, 10),
    note: note || null,
  })
}

// ===== Public Actions =====

export async function createSample(data: {
  client: string
  source?: string
  samplingAt: string
  receivedAt: string
  categoryId: number
  quantity?: string
  condition?: string
  remarks?: string
}) {
  try {
    const { userId } = await checkAuth(['admin', 'front_desk'])
    const db = await getDb()

    // Validate category exists
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, data.categoryId),
    })
    if (!category) {
      return { success: false, error: 'Category not found' }
    }

    // Generate sample ID
    const sampleCode = await generateSampleId()

    // Calculate due date
    const dueDate = new Date(data.receivedAt)
    dueDate.setHours(dueDate.getHours() + category.defaultTatHours)

    // Create sample
    const result = await db.insert(samples).values({
      sampleCode,
      categoryId: data.categoryId,
      client: data.client,
      source: data.source || null,
      samplingAt: new Date(data.samplingAt),
      receivedAt: new Date(data.receivedAt),
      receivedBy: parseInt(userId, 10),
      quantity: data.quantity || null,
      condition: data.condition || null,
      remarks: data.remarks || null,
      status: 'registered',
      dueAt: dueDate,
    })

    const sampleId = result[0].insertId

    // Copy tests from category
    const categoryTests = await db.query.tests.findMany({
      where: and(eq(tests.categoryId, data.categoryId), eq(tests.active, true)),
    })

    if (categoryTests.length > 0) {
      await db.insert(sampleTests).values(
        categoryTests.map((test) => ({
          sampleId: sampleId,
          testId: test.id,
          assignedTo: null,
          status: 'pending' as const,
        }))
      )
    }

    // Write status event
    await writeStatusEvent(sampleId, 'none', 'registered', userId, 'Sample registered')

    return { success: true, sampleCode, sampleId }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create sample' }
  }
}

export async function assignTests(sampleId: number, assignments: Array<{ testId: number; assignedTo: number | null }>) {
  try {
    await checkAuth(['admin'])
    const db = await getDb()

    // Verify sample exists and is in correct state
    const sample = await db.query.samples.findFirst({
      where: eq(samples.id, sampleId),
    })
    if (!sample) {
      return { success: false, error: 'Sample not found' }
    }
    if (sample.status !== 'registered') {
      return { success: false, error: `Cannot assign: sample status is ${sample.status}` }
    }

    // Update sample_tests
    for (const assignment of assignments) {
      await db
        .update(sampleTests)
        .set({ assignedTo: assignment.assignedTo })
        .where(and(eq(sampleTests.sampleId, sampleId), eq(sampleTests.testId, assignment.testId)))
    }

    // Move sample to assigned
    await db.update(samples).set({ status: 'assigned' }).where(eq(samples.id, sampleId))

    // Write status event
    const session = await auth()
    const userId = (session?.user as any)?.id || '0'
    await writeStatusEvent(sampleId, 'registered', 'assigned', userId, 'Tests assigned')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to assign tests' }
  }
}

export async function markTestInProgress(testId: number, sampleId: number) {
  try {
    const { userId } = await checkAuth(['admin', 'analyst'])
    const db = await getDb()

    // Update test status
    await db.update(sampleTests).set({ status: 'in_progress' }).where(eq(sampleTests.id, testId))

    // Auto-advance sample if not already
    const sample = await db.query.samples.findFirst({
      where: eq(samples.id, sampleId),
    })
    if (sample && sample.status === 'assigned') {
      await db.update(samples).set({ status: 'in_analysis' }).where(eq(samples.id, sampleId))
      await writeStatusEvent(sampleId, 'assigned', 'in_analysis', userId, 'First test started')
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to mark test in progress' }
  }
}

export async function completeTest(
  testId: number,
  sampleId: number,
  resultValue: string,
  resultUnit: string,
  method?: string
) {
  try {
    const { userId } = await checkAuth(['admin', 'analyst'])
    const db = await getDb()

    // Update test
    await db
      .update(sampleTests)
      .set({
        status: 'done',
        resultValue,
        resultUnit,
        method: method || null,
        doneAt: new Date(),
      })
      .where(eq(sampleTests.id, testId))

    // Check if all tests are done
    const pendingTests = await db.query.sampleTests.findMany({
      where: and(eq(sampleTests.sampleId, sampleId), ({ not, eq: dbEq }) =>
        dbEq(sampleTests.status, 'done')
      ),
    })

    // If all done, auto-advance to under_review
    if (pendingTests.length === 0) {
      const sample = await db.query.samples.findFirst({
        where: eq(samples.id, sampleId),
      })
      if (sample && sample.status === 'in_analysis') {
        await db.update(samples).set({ status: 'under_review' }).where(eq(samples.id, sampleId))
        await writeStatusEvent(sampleId, 'in_analysis', 'under_review', userId, 'All tests completed')
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to complete test' }
  }
}

export async function submitReview(
  sampleId: number,
  approved: boolean,
  rejectReason?: string,
  reopenTestIds?: number[]
) {
  try {
    const { userId } = await checkAuth(['admin', 'reviewer'])
    const db = await getDb()

    const sample = await db.query.samples.findFirst({
      where: eq(samples.id, sampleId),
    })
    if (!sample || sample.status !== 'under_review') {
      return { success: false, error: 'Sample is not under review' }
    }

    if (approved) {
      await db.update(samples).set({ status: 'approved' }).where(eq(samples.id, sampleId))
      await writeStatusEvent(sampleId, 'under_review', 'approved', userId, 'Approved by reviewer')
    } else {
      await db.update(samples).set({ status: 'in_analysis' }).where(eq(samples.id, sampleId))
      // Reopen specific tests if provided
      if (reopenTestIds && reopenTestIds.length > 0) {
        for (const testId of reopenTestIds) {
          await db
            .update(sampleTests)
            .set({ status: 'pending', resultValue: null, resultUnit: null, doneAt: null })
            .where(and(eq(sampleTests.sampleId, sampleId), eq(sampleTests.id, testId)))
        }
      }
      await writeStatusEvent(
        sampleId,
        'under_review',
        'in_analysis',
        userId,
        `Rejected: ${rejectReason || 'No reason provided'}`
      )
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to submit review' }
  }
}

export async function submitApproval(sampleId: number, approved: boolean, rejectReason?: string) {
  try {
    const { userId } = await checkAuth(['admin', 'signatory'])
    const db = await getDb()

    const sample = await db.query.samples.findFirst({
      where: eq(samples.id, sampleId),
    })
    if (!sample || sample.status !== 'approved') {
      return { success: false, error: 'Sample is not approved' }
    }

    if (approved) {
      await db.update(samples).set({ status: 'reported' }).where(eq(samples.id, sampleId))
      await writeStatusEvent(sampleId, 'approved', 'reported', userId, 'Approved by signatory')
    } else {
      await db.update(samples).set({ status: 'under_review' }).where(eq(samples.id, sampleId))
      await writeStatusEvent(
        sampleId,
        'approved',
        'under_review',
        userId,
        `Rejected: ${rejectReason || 'No reason provided'}`
      )
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to submit approval' }
  }
}

export async function getSampleBoard() {
  try {
    await checkAuth()
    const db = await getDb()

    const allSamples = await db.query.samples.findMany({
      with: {
        category: true,
        sampleTests: {
          with: {
            test: true,
          },
        },
      },
      orderBy: (samples, { asc }) => [asc(samples.createdAt)],
    })

    return { success: true, samples: allSamples, timestamp: new Date() }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch board' }
  }
}

export async function getSampleDetail(sampleId: number) {
  try {
    await checkAuth()
    const db = await getDb()

    const sample = await db.query.samples.findFirst({
      where: eq(samples.id, sampleId),
      with: {
        category: true,
        sampleTests: {
          with: {
            test: true,
            assignedToUser: true,
          },
        },
      },
    })

    if (!sample) {
      return { success: false, error: 'Sample not found' }
    }

    const events = await db.query.statusEvents.findMany({
      where: eq(statusEvents.sampleId, sampleId),
      with: {
        byUser: true,
      },
      orderBy: (statusEvents, { desc }) => [desc(statusEvents.createdAt)],
    })

    return { success: true, sample, events }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch sample' }
  }
}
