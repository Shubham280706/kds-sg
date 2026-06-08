'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { getReviewDashboardMetrics } from '@/lib/actions/reviewer'

export default function ReviewDashboard() {
  const [metrics, setMetrics] = useState({ readyForReview: 0, approvedToday: 0 })
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
            <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.readyForReview}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
              Approved Today
            </p>
            <p className="text-3xl font-bold text-green-600 mt-2">{metrics.approvedToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
              Pending Review
            </p>
            <p className="text-3xl font-bold text-amber-600 mt-2">
              {metrics.readyForReview - metrics.approvedToday}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
              Approval Rate
            </p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {metrics.readyForReview > 0
                ? Math.round((metrics.approvedToday / metrics.readyForReview) * 100)
                : 0}
              %
            </p>
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
