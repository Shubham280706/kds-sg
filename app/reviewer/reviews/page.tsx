'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getReviewHistory } from '@/lib/actions/reviewer'

interface Review {
  id: number
  sampleId: number
  fromStatus: string
  toStatus: string
  note: string | null
  createdAt: Date
  byUser: { id: number; name: string } | null
  sample: {
    sampleCode: string
    client: string
    category: { name: string }
  }
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
    const interval = setInterval(fetchReviews, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchReviews() {
    const result = await getReviewHistory()
    if (result.success) {
      setReviews(result.reviews || [])
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading review history...</div>
  }

  const approvedCount = reviews.filter((r) => ['approved', 'ready_to_issue', 'issued'].includes(r.toStatus)).length
  const rejectedCount = reviews.filter((r) => r.toStatus === 'in_analysis').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-600 mt-2">Your review history and decisions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 uppercase">Total Reviews</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{reviews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 uppercase">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 uppercase">Requested Revision</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Recent Reviews</h2>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No reviews yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Sample</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Decision</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reviews.filter(r => r.sample !== null).map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{review.sample?.sampleCode}</td>
                      <td className="py-3 px-4 text-sm">{review.sample?.client}</td>
                      <td className="py-3 px-4 text-sm">{review.sample?.category?.name}</td>
                      <td className="py-3 px-4">
                        {review.toStatus === 'approved' && (
                          <Badge className="bg-green-100 text-green-800">✓ Approved</Badge>
                        )}
                        {review.toStatus === 'ready_to_issue' && (
                          <Badge className="bg-green-100 text-green-800">✅ Ready to Issue</Badge>
                        )}
                        {review.toStatus === 'issued' && (
                          <Badge className="bg-emerald-100 text-emerald-800">📋 Issued</Badge>
                        )}
                        {review.toStatus === 'in_analysis' && (
                          <Badge className="bg-amber-100 text-amber-800">
                            ↻ Revision Requested
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
