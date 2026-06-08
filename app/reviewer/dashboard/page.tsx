'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { getReviewDashboardMetrics } from '@/lib/actions/reviewer'

export default function ReviewDashboard() {
  const [metrics, setMetrics] = useState({
    readyForReview: 0,
    approvedToday: 0,
    rejectedToday: 0,
    pendingReview: 0,
    approvalRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  async function fetchMetrics() {
    const result = await getReviewDashboardMetrics()
    if (result.success) {
      setMetrics({
        readyForReview: result.readyForReview || 0,
        approvedToday: result.approvedToday || 0,
        rejectedToday: result.rejectedToday || 0,
        pendingReview: result.pendingReview || 0,
        approvalRate: result.approvalRate || 0,
      })
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Dashboard</h1>
        <p className="text-gray-600 mt-2">Your review metrics and statistics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
              Ready for Review
            </p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{metrics.readyForReview}</p>
            <p className="text-xs text-gray-500 mt-2">Waiting to be reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
              Approved Today
            </p>
            <p className="text-3xl font-bold text-green-600 mt-2">{metrics.approvedToday}</p>
            <p className="text-xs text-gray-500 mt-2">Approved in last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
              Pending Revision
            </p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{metrics.pendingReview}</p>
            <p className="text-xs text-gray-500 mt-2">Sent back to analyst</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
              Approval Rate
            </p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">
              {metrics.approvalRate}%
            </p>
            <p className="text-xs text-gray-500 mt-2">Today&apos;s decision rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h2 className="text-lg font-semibold text-blue-900">Dashboard Overview</h2>
        <p className="text-blue-600 mt-2">
          Monitor your review metrics and go to the Review Queue to process samples.
        </p>
      </div>
    </div>
  )
}
