'use server'

import { auth } from '@/auth/authOptions'
import { getDb } from '@/db'
import { samples, statusEvents, sampleTests } from '@/db/schema'
import { eq, and, inArray, gte } from 'drizzle-orm'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized: Not authenticated')
  }
  if (!['admin', 'reviewer'].includes(session.user?.role || '')) {
    throw new Error('Unauthorized: Reviewer or admin access required')
  }
  return session
}

export async function getReviewQueue() {
  try {
    await checkAuth()
    const db = await getDb()

    const samples_data = await db.query.samples.findMany({
      where: eq(samples.status, 'under_review' as any),
      with: {
        category: true,
        sampleTests: {
          with: {
            test: true,
            assignedToUser: true,
          },
        },
      },
      orderBy: (samples, { asc }) => [asc(samples.dueAt)],
    })

    return { success: true, samples: samples_data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getReviewDashboardMetrics() {
  try {
    await checkAuth()
    const db = await getDb()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Ready for review (under_review status)
    const readyForReview = await db.query.samples.findMany({
      where: eq(samples.status, 'under_review' as any),
    })

    // Approved today
    const approvedToday = await db.query.samples.findMany({
      where: and(
        eq(samples.status, 'approved' as any),
        gte(samples.updatedAt, today)
      ),
    })

    // Rejected today (sent back to in_analysis)
    const rejectedToday = await db.query.statusEvents.findMany({
      where: and(
        eq(statusEvents.fromStatus, 'under_review' as any),
        eq(statusEvents.toStatus, 'in_analysis' as any),
        gte(statusEvents.createdAt, today)
      ),
    })

    // Currently pending review (in_analysis status)
    const pendingReview = await db.query.samples.findMany({
      where: eq(samples.status, 'in_analysis' as any),
    })

    // Calculate approval rate
    const totalReviewedToday = approvedToday.length + rejectedToday.length
    const approvalRate = totalReviewedToday > 0
      ? Math.round((approvedToday.length / totalReviewedToday) * 100)
      : 0

    return {
      success: true,
      readyForReview: readyForReview.length,
      approvedToday: approvedToday.length,
      rejectedToday: rejectedToday.length,
      pendingReview: pendingReview.length,
      approvalRate: approvalRate,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getSampleForReview(sampleId: number) {
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

    return { success: true, sample }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function approveReview(sampleId: number, comment: string = '') {
  try {
    const session = await checkAuth()
    const db = await getDb()
    const userId = parseInt((session.user as any).id, 10)

    // Update sample status
    await db
      .update(samples)
      .set({ status: 'approved' as any })
      .where(eq(samples.id, sampleId))

    // Write status event
    await db.insert(statusEvents).values({
      sampleId,
      fromStatus: 'under_review',
      toStatus: 'approved',
      byUser: userId,
      note: comment || 'Sample approved by reviewer',
      createdAt: new Date(),
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function rejectReview(
  sampleId: number,
  reason: string,
  testIdsToReopen: number[]
) {
  try {
    const session = await checkAuth()
    const db = await getDb()
    const userId = parseInt((session.user as any).id, 10)

    // Update sample status back to in_analysis
    await db
      .update(samples)
      .set({ status: 'in_analysis' as any })
      .where(eq(samples.id, sampleId))

    // Reopen specific tests
    if (testIdsToReopen.length > 0) {
      await db
        .update(sampleTests)
        .set({ status: 'pending' as any, doneAt: null, resultValue: null, resultUnit: null })
        .where(inArray(sampleTests.id, testIdsToReopen))
    }

    // Write status event
    await db.insert(statusEvents).values({
      sampleId,
      fromStatus: 'under_review',
      toStatus: 'in_analysis',
      byUser: userId,
      note: `Revision requested: ${reason}`,
      createdAt: new Date(),
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getReviewHistory() {
  try {
    await checkAuth()
    const db = await getDb()

    const events = await db.query.statusEvents.findMany({
      where: and(
        eq(statusEvents.fromStatus, 'under_review' as any),
        inArray(statusEvents.toStatus, ['approved' as any, 'in_analysis' as any])
      ),
      with: {
        sample: {
          with: {
            category: true,
          },
        },
        byUser: true,
      },
      orderBy: (statusEvents, { desc }) => [desc(statusEvents.createdAt)],
      limit: 100,
    })

    return { success: true, reviews: events }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
