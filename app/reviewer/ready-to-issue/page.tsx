'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { approveReview, getReadyToIssueQueue } from '@/lib/actions/reviewer'

interface Sample {
  id: number
  sampleCode: string
  client: string
  status: string
  dueAt: Date | null
  category: { name: string; color: string }
  sampleTests: Array<{
    id: number
    test: { name: string; unit: string }
    resultValue: string | null
    resultUnit: string | null
    assignedToUser: { name: string } | null
  }>
}

export default function ReadyToIssueQueuePage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchQueue() {
    const result = await getReadyToIssueQueue()
    if (result.success) {
      setSamples(result.samples || [])
    }
    setIsLoading(false)
  }

  async function handleMarkAsIssued(sampleId: number) {
    setProcessingId(sampleId)
    try {
      const result = await approveReview(sampleId, '', 'issued')
      if (result.success) {
        await fetchQueue()
      }
    } finally {
      setProcessingId(null)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading ready to issue queue...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ready to Issue</h1>
        <p className="text-gray-600 mt-2">Samples approved and ready for final issuance</p>
      </div>

      {samples.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
          <p className="text-lg font-semibold text-green-700">✓ All caught up!</p>
          <p className="text-green-600 mt-2">No samples ready to issue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
          {samples.map((sample) => {
            const totalTests = sample.sampleTests.length
            const completedTests = sample.sampleTests.filter(
              (t) => t.resultValue
            ).length
            const isOverdue = sample.dueAt ? new Date(sample.dueAt) < new Date() : false

            return (
              <div
                key={sample.id}
                className="p-5 rounded-lg border-l-4 border-l-green-500 bg-green-50"
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
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${(completedTests / totalTests) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="border-t border-green-200 pt-3 flex items-center justify-between gap-3">
                  <span className={isOverdue ? 'text-red-600 font-semibold text-sm' : 'text-gray-600 text-sm'}>
                    {isOverdue ? 'Overdue' : 'On time'}
                  </span>
                  <Button
                    onClick={() => handleMarkAsIssued(sample.id)}
                    disabled={processingId === sample.id}
                    className="bg-green-800 hover:bg-green-900 text-white text-sm"
                  >
                    {processingId === sample.id ? '⏳ Issuing...' : '📋 Mark as Issued'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
