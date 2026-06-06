'use client'

import { useEffect, useState } from 'react'
import { SampleCard } from '@/components/SampleCard'
import { Badge } from '@/components/ui/badge'

interface Sample {
  id: number
  code: string
  client: string
  category: { id: number; name: string; color: string }
  status: string
  sampleTests: Array<{ id: number; status: string; assignedToUser?: { name: string } | null }>
  dueAt: Date
  createdAt: Date
}

const STATUS_ORDER = ['registered', 'assigned', 'in_analysis', 'under_review', 'approved', 'reported']
const STATUS_LABELS: Record<string, string> = {
  registered: 'Registered',
  assigned: 'Assigned',
  in_analysis: 'In Analysis',
  under_review: 'Under Review',
  approved: 'Approved',
  reported: 'Reported',
}

export default function DashboardPage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Polling for board updates
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await fetch('/api/samples/board')
        if (response.ok) {
          const data = await response.json()
          setSamples(data.samples || [])
          setLastUpdated(new Date(data.timestamp))
        }
      } catch (error) {
        console.error('Failed to fetch board:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBoard()
    const interval = setInterval(fetchBoard, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [])

  const samplesByStatus = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = samples.filter((s) => s.status === status)
      return acc
    },
    {} as Record<string, Sample[]>
  )

  if (isLoading) {
    return <div className="text-center py-12">Loading board...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KDS Board</h1>
          <p className="text-gray-600 mt-2">Real-time sample tracking</p>
        </div>
        {lastUpdated && (
          <div className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Status Columns */}
      <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
        {STATUS_ORDER.map((status) => {
          const columnSamples = samplesByStatus[status]
          return (
            <div key={status} className="flex-shrink-0 w-80">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                {/* Column Header */}
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">
                    {STATUS_LABELS[status]}
                    <Badge variant="default" className="ml-2 text-xs">
                      {columnSamples.length}
                    </Badge>
                  </h2>
                </div>

                {/* Sample Cards */}
                <div className="space-y-3">
                  {columnSamples.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No samples</p>
                    </div>
                  ) : (
                    columnSamples.map((sample) => {
                      const completedTests = sample.sampleTests.filter(
                        (t) => t.status === 'done'
                      ).length
                      const totalTests = sample.sampleTests.length
                      const analyst = sample.sampleTests.find((t) => t.assignedToUser)
                        ?.assignedToUser?.name

                      return (
                        <SampleCard
                          key={sample.id}
                          id={sample.id}
                          code={sample.code}
                          client={sample.client}
                          categoryName={sample.category.name}
                          categoryColor={sample.category.color}
                          status={sample.status}
                          completedTests={completedTests}
                          totalTests={totalTests}
                          assignedAnalyst={analyst}
                          dueAt={new Date(sample.dueAt)}
                          createdAt={new Date(sample.createdAt)}
                        />
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats Footer */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-6 gap-4 text-sm">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="text-center">
              <p className="text-gray-600">{STATUS_LABELS[status]}</p>
              <p className="text-2xl font-bold text-gray-900">{samplesByStatus[status].length}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
