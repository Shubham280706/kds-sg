'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeTest } from '@/lib/actions/samples'

interface SampleTest {
  id: number
  sampleId: number
  testId: number
  status: string
  resultValue: string | null
  resultUnit: string | null
  method: string | null
  test: { id: number; name: string; unit: string }
  sample: {
    id: number
    code: string
    client: string
    dueAt: Date
    category: { id: number; name: string; color: string }
  }
}

interface SampleGroup {
  sampleId: number
  code: string
  client: string
  categoryName: string
  categoryColor: string
  tests: SampleTest[]
}

export default function AnalystQueuePage() {
  const [allTests, setAllTests] = useState<SampleTest[]>([])
  const [expandedTest, setExpandedTest] = useState<number | null>(null)
  const [resultData, setResultData] = useState<Record<number, { value: string; unit: string; method: string }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [completingTests, setCompletingTests] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTests = async () => {
      const res = await fetch(`/api/analyst/queue`)
      if (res.ok) {
        const data = await res.json()
        setAllTests(data.tests || [])
      }
      setIsLoading(false)
    }
    fetchTests()

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchTests, 3000)
    return () => clearInterval(interval)
  }, [])

  // Group tests by sample
  const sampleGroupsMap = allTests.reduce((map, test) => {
    const key = test.sampleId
    if (!map.has(key)) {
      map.set(key, {
        sampleId: test.sampleId,
        code: test.sample.code,
        client: test.sample.client,
        categoryName: test.sample.category.name,
        categoryColor: test.sample.category.color,
        tests: [],
      })
    }
    map.get(key)!.tests.push(test)
    return map
  }, new Map<number, SampleGroup>())

  const sampleGroups = Array.from(sampleGroupsMap.values())

  const pendingTests = allTests.filter((t) => t.status !== 'done')
  const doneTests = allTests.filter((t) => t.status === 'done')
  const completedCount = doneTests.length
  const totalCount = allTests.length

  const handleCompleteTest = async (testId: number, sampleId: number) => {
    const data = resultData[testId]
    if (!data?.value) {
      setError('Please enter a result value')
      return
    }

    setCompletingTests((prev) => new Set(prev).add(testId))
    setError('')

    try {
      const result = await completeTest(
        testId,
        sampleId,
        data.value,
        data.unit || allTests.find((t) => t.id === testId)?.test.unit || '',
        data.method
      )

      if (result.success) {
        // Optimistic update
        setAllTests((prev) =>
          prev.map((t) => (t.id === testId ? { ...t, status: 'done' } : t))
        )
        setExpandedTest(null)
        setResultData((prev) => ({
          ...prev,
          [testId]: { value: '', unit: '', method: '' },
        }))
      } else {
        setError(result.error || 'Failed to complete test')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setCompletingTests((prev) => {
        const next = new Set(prev)
        next.delete(testId)
        return next
      })
    }
  }

  if (isLoading) return <div className="text-center py-12">Loading your queue...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Test Queue</h1>
        <p className="text-gray-600 mt-2">Tests assigned to you, organized by sample</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Progress Bar */}
      {totalCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-3">
              <p className="font-medium text-gray-900">Overall Progress</p>
              <span className="text-2xl font-bold text-gray-900">
                {completedCount} / {totalCount}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tests Grouped by Sample */}
      {totalCount === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No tests assigned to you yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sampleGroups.map((group) => {
            const samplePendingTests = group.tests.filter((t) => t.status !== 'done')
            const sampleDoneTests = group.tests.filter((t) => t.status === 'done')
            const sampleCompleted = sampleDoneTests.length
            const sampleTotal = group.tests.length

            return (
              <Card key={group.sampleId} className="overflow-hidden">
                {/* Sample Header */}
                <div
                  className="p-4 border-b"
                  style={{ backgroundColor: `${group.categoryColor}15` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 font-mono mb-3">
                        {group.code}
                      </h3>
                      <span
                        className="font-medium inline-block px-2 py-1 rounded text-white text-xs"
                        style={{ backgroundColor: group.categoryColor }}
                      >
                        {group.categoryName}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Tests</p>
                      <p className="text-lg font-bold text-gray-900">
                        {sampleCompleted}/{sampleTotal}
                      </p>
                    </div>
                  </div>

                  {/* Sample Progress Bar */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(sampleCompleted / sampleTotal) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Tests */}
                <CardContent className="p-0">
                  {/* Pending Tests */}
                  {samplePendingTests.length > 0 && (
                    <div className="divide-y">
                      {samplePendingTests.map((st) => {
                        const isCompleting = completingTests.has(st.id)

                        return (
                          <div
                            key={st.id}
                            className="border-b last:border-b-0"
                          >
                            {/* Test Row */}
                            <div
                              className="p-4 cursor-pointer flex items-center gap-4 hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                setExpandedTest(expandedTest === st.id ? null : st.id)
                              }
                            >
                              {/* Checkbox */}
                              <div className="flex-shrink-0">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() => {}}
                                  className="w-5 h-5 cursor-pointer accent-blue-600"
                                />
                              </div>

                              {/* Test Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900">
                                  {st.test.name}
                                </p>
                                <p className="text-sm text-gray-600 mt-0.5">
                                  Unit: <span className="font-mono">{st.test.unit}</span>
                                </p>
                              </div>

                              {/* Expand Indicator */}
                              <span className="text-gray-400 text-lg flex-shrink-0">
                                {expandedTest === st.id ? '▼' : '▶'}
                              </span>
                            </div>

                            {/* Expanded Form */}
                            {expandedTest === st.id && (
                              <div className="p-4 bg-blue-50 border-t space-y-4">
                                <div>
                                  <Label htmlFor={`value-${st.id}`}>
                                    Result Value *
                                  </Label>
                                  <Input
                                    id={`value-${st.id}`}
                                    type="text"
                                    value={resultData[st.id]?.value || ''}
                                    onChange={(e) =>
                                      setResultData({
                                        ...resultData,
                                        [st.id]: {
                                          ...resultData[st.id],
                                          value: e.target.value,
                                        },
                                      })
                                    }
                                    placeholder="e.g., 7.5"
                                    autoFocus
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`unit-${st.id}`}>Unit</Label>
                                  <Input
                                    id={`unit-${st.id}`}
                                    value={
                                      resultData[st.id]?.unit || st.test.unit
                                    }
                                    onChange={(e) =>
                                      setResultData({
                                        ...resultData,
                                        [st.id]: {
                                          ...resultData[st.id],
                                          unit: e.target.value,
                                        },
                                      })
                                    }
                                    placeholder={st.test.unit}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`method-${st.id}`}>
                                    Method (Optional)
                                  </Label>
                                  <Input
                                    id={`method-${st.id}`}
                                    value={
                                      resultData[st.id]?.method || ''
                                    }
                                    onChange={(e) =>
                                      setResultData({
                                        ...resultData,
                                        [st.id]: {
                                          ...resultData[st.id],
                                          method: e.target.value,
                                        },
                                      })
                                    }
                                    placeholder="e.g., Glass electrode"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() =>
                                      handleCompleteTest(st.id, st.sampleId)
                                    }
                                    disabled={
                                      !resultData[st.id]?.value ||
                                      isCompleting
                                    }
                                    size="sm"
                                  >
                                    {isCompleting
                                      ? 'Marking...'
                                      : 'Mark as Done'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setExpandedTest(null)
                                      setError('')
                                    }}
                                    disabled={isCompleting}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Completed Tests */}
                  {sampleDoneTests.length > 0 && (
                    <div className="bg-green-50 divide-y">
                      {sampleDoneTests.map((st) => (
                        <div
                          key={st.id}
                          className="p-4 flex items-start gap-4"
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            disabled
                            className="cursor-default accent-green-600 mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-600 line-through">
                              {st.test.name}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-semibold">Result:</span>{' '}
                              {st.resultValue} {st.resultUnit || st.test.unit}
                            </p>
                            {st.method && (
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold">Method:</span>{' '}
                                {st.method}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* All Complete Banner */}
      {totalCount > 0 && pendingTests.length === 0 && doneTests.length > 0 && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center animate-in">
          <p className="font-semibold text-green-900">
            ✅ All tests complete! Your samples are ready for review.
          </p>
        </div>
      )}
    </div>
  )
}
