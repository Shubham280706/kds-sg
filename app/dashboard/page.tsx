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



export default function DashboardPage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [kpis, setKpis] = useState<KPIMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
            registeredToday: kpiResult.registeredToday || 0,
            readyForReview: kpiResult.readyForReview || 0,
            inAnalysis: kpiResult.inAnalysis || 0,
            overdue: kpiResult.overdue || 0,
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

  // Get unique categories from samples
  const categories = Array.from(
    new Set(samples.map((s) => s.category?.name).filter(Boolean))
  ).sort()

  // Filter samples by category
  const filteredSamples = selectedCategory
    ? samples.filter((s) => s.category?.name === selectedCategory)
    : samples

  // Sort: active/newest first, completed/oldest last
  const statusPriority: Record<string, number> = {
    registered: 1,
    assigned: 2,
    in_analysis: 3,
    under_review: 4,
    ready_to_issue: 5,
    approved: 6,
    reported: 7,
    issued: 8,
    closed: 9,
  }

  const sortedSamples = [...filteredSamples].sort((a, b) => {
    const priorityA = statusPriority[a.status] || 999
    const priorityB = statusPriority[b.status] || 999

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading board...</div>
  }

  return (
    <div className="space-y-3">
      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* KPI Strip */}
      {kpis && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard label="Registered Today" value={kpis.registeredToday} />
          <KPICard label="Ready for Review" value={kpis.readyForReview} color="green" />
          <KPICard label="In Analysis" value={kpis.inAnalysis} color="blue" />
          <KPICard label="Overdue" value={kpis.overdue} color={kpis.overdue > 0 ? 'red' : 'default'} />
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
          }`}
        >
          All Categories
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Sample Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {selectedCategory ? selectedCategory : 'All Samples'}
          <Badge variant="default" className="ml-2">
            {sortedSamples.length}
          </Badge>
        </h2>

        {samples.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
            <p className="text-gray-500">No samples yet. Register one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 auto-rows-max">
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
     
    </div>
  )
}
