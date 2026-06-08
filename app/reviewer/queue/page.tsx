'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { getReviewQueue } from '@/lib/actions/reviewer'
import { ReviewModal } from '@/components/ReviewModal'

interface Sample {
  id: number
  sampleCode: string
  client: string
  dueAt: Date
  category: { name: string; color: string }
  sampleTests: Array<{
    id: number
    test: { name: string; unit: string }
    resultValue: string | null
    resultUnit: string | null
    assignedToUser: { name: string } | null
  }>
}

export default function ReviewQueuePage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchQueue() {
    const result = await getReviewQueue()
    if (result.success) {
      setSamples(result.samples || [])
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading review queue...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Queue</h1>
        <p className="text-gray-600 mt-2">Samples ready for your review</p>
      </div>

      {samples.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
          <p className="text-lg font-semibold text-green-700">✓ All caught up!</p>
          <p className="text-green-600 mt-2">No samples waiting for review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
          {samples.map((sample) => {
            const totalTests = sample.sampleTests.length
            const completedTests = sample.sampleTests.filter(
              (t) => t.resultValue
            ).length
            const isOverdue = new Date(sample.dueAt) < new Date()

            return (
              <div
                key={sample.id}
                onClick={() => setSelectedSample(sample)}
                className="p-5 rounded-lg border-l-4 border-orange-500 bg-orange-50 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg font-mono text-gray-900">
                      {sample.sampleCode}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{sample.client}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {completedTests}/{totalTests}
                  </span>
                </div>

                <Badge className="mb-3" style={{ backgroundColor: sample.category.color }}>
                  {sample.category.name}
                </Badge>

                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${(completedTests / totalTests) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="border-t border-orange-200 pt-3 flex items-center justify-between text-xs">
                  <Badge variant="default">Under Review</Badge>
                  <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                    {isOverdue ? 'Overdue' : 'On time'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedSample && (
        <ReviewModal
          sample={selectedSample}
          onClose={() => setSelectedSample(null)}
          onReload={fetchQueue}
        />
      )}
    </div>
  )
}
