'use server'

import { getDb } from '@/db'
import { and } from 'drizzle-orm'
import { auth } from '@/auth/authOptions'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized: Not authenticated')
  }
  return session
}

export async function getKPIMetrics() {
  try {
    await checkAuth()
    const db = await getDb()

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Registered today (regardless of current status)
    const registeredTodayResult = await db.query.samples.findMany({
      where: (samples, { gte }) =>
        gte(samples.createdAt, today),
    })

    // Ready for review (under_review + ready_to_issue statuses)
    const readyForReviewResult = await db.query.samples.findMany({
      where: (samples, { inArray }) =>
        inArray(samples.status, ['under_review' as any, 'ready_to_issue' as any]),
    })

    // In analysis (assigned + in_analysis statuses)
    const inAnalysisResult = await db.query.samples.findMany({
      where: (samples, { inArray }) =>
        inArray(samples.status, ['assigned' as any, 'in_analysis' as any]),
    })

    // Overdue: dueAt < now AND status NOT IN (approved, ready_to_issue, issued, reported, closed)
    const now = new Date()
    const overdueResult = await db.query.samples.findMany({
      where: (samples, { lt, notInArray: notIn }) =>
        and(
          lt(samples.dueAt, now),
          notIn(samples.status, ['approved' as any, 'ready_to_issue' as any, 'issued' as any, 'reported' as any, 'closed' as any])
        ),
    })

    return {
      success: true,
      registeredToday: registeredTodayResult.length,
      readyForReview: readyForReviewResult.length,
      inAnalysis: inAnalysisResult.length,
      overdue: overdueResult.length,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch KPI metrics',
      registeredToday: 0,
      readyForReview: 0,
      inAnalysis: 0,
      overdue: 0,
    }
  }
}
