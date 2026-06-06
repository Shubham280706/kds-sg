'use client'

import { useEffect, useState } from 'react'
import { SampleCard } from '@/components/SampleCard'
import { KPICard } from '@/components/KPICard'
import { Badge } from '@/components/ui/badge'
import { getKPIMetrics } from '@/lib/actions/dashboard'

interface Sample {
  id: number
  code: string
  client: string
  category: { id: number; name: string; color: string }
  status: string
  sampleTests: Array<{
    id: number
    testId: number
    status: string
    test: { name: string }
    assignedToUser?: { name: string } | null
  }>
  dueAt: Date
  createdAt: Date
}

interface KPIMetrics {
  registeredToday: number
  readyForReview: number
  inAnalysis: number
  overdue: number
}

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
  const [kpis, setKpis] = useState<KPIMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Polling for board updates and KPI metrics
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch board data
        const boardResponse = await fetch('/api/samples/board')
        if (boardResponse.ok) {
          const boardData = await boardResponse.json()
          setSamples(boardData.samples || [])
          setLastUpdated(new Date(boardData.timestamp))
        }

        // Fetch KPI metrics
        const kpiResult = await getKPIMetrics()
        if (kpiResult.success) {
          setKpis({
            registeredToday: kpiResult.registeredToday,
            readyForReview: kpiResult.readyForReview,
            inAnalysis: kpiResult.inAnalysis,
            overdue: kpiResult.overdue,
          })
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [])

  // Sort samples by priority and due date
  const sortedSamples = [...samples].sort((a, b) => {
    const dateA = new Date(a.dueAt).getTime()
    const dateB = new Date(b.dueAt).getTime()
    return dateA - dateB
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading board...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Highlights & Notes</h1>
          <p className="text-gray-600 mt-2">Real-time sample tracking</p>
        </div>
        {lastUpdated && (
          <div className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* KPI Strip */}
      {kpis && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard label="Registered Today" value={kpis.registeredToday} />
          <KPICard label="Ready for Review" value={kpis.readyForReview} color="green" />
          <KPICard label="In Analysis" value={kpis.inAnalysis} color="blue" />
          <KPICard label="Overdue" value={kpis.overdue} color={kpis.overdue > 0 ? 'red' : 'default'} />
        </div>
      )}

      {/* Sample Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          All Samples
          <Badge variant="default" className="ml-2">
            {samples.length}
          </Badge>
        </h2>

        {samples.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
            <p className="text-gray-500">No samples yet. Register one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
            {sortedSamples.map((sample) => (
              <SampleCard
                key={sample.id}
                id={sample.id}
                code={sample.code}
                client={sample.client}
                categoryName={sample.category.name}
                categoryColor={sample.category.color}
                status={sample.status}
                tests={sample.sampleTests.map((st) => ({
                  id: st.id,
                  name: st.test.name,
                  status: st.status,
                  assignedToUser: st.assignedToUser,
                }))}
                dueAt={new Date(sample.dueAt)}
                createdAt={new Date(sample.createdAt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status Summary Footer */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Summary</h3>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6 text-sm">
          {Object.entries(STATUS_LABELS).map(([status, label]) => {
            const count = samples.filter((s) => s.status === status).length
            return (
              <div key={status} className="text-center">
                <p className="text-gray-600 text-xs font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
