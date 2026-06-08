'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { completeTest } from '@/lib/actions/samples'

interface SampleTest {
  id: number
  sampleId: number
  testId: number
  status: string
  resultValue: string | null
  resultUnit: string | null
  method: string | null
  doneAt: Date | null
  test: { id: number; name: string; unit: string }
  sample: {
    id: number
    sampleCode: string
    client: string
    dueAt: Date
    category: { id: number; name: string; color: string }
  }
}

interface SampleGroup {
  sampleId: number
  sampleCode: string
  categoryName: string
  categoryColor: string
  tests: SampleTest[]
  dueAt: Date
}

export default function AnalystQueuePage() {
  const [allTests, setAllTests] = useState<SampleTest[]>([])
  const [expandedTest, setExpandedTest] = useState<number | null>(null)
  const [resultData, setResultData] = useState<Record<number, { value: string; unit: string; method: string }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [completingTests, setCompletingTests] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)

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

  const pendingTests = allTests.filter((t) => t.status !== 'done')
  const completedTests = allTests.filter((t) => t.status === 'done')

  // Group pending tests by sample, sorted by due date
  const pendingSampleGroups = Array.from(
    pendingTests.reduce((map, test) => {
      const key = test.sampleId
      if (!map.has(key)) {
        map.set(key, {
          sampleId: test.sampleId,
          sampleCode: test.sample.sampleCode,
          categoryName: test.sample.category.name,
          categoryColor: test.sample.category.color,
          tests: [],
          dueAt: test.sample.dueAt,
        })
      }
      map.get(key)!.tests.push(test)
      return map
    }, new Map<number, SampleGroup>())
  )
    .values()
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())

  // Group completed tests by sample
  const completedSampleGroups = Array.from(
    completedTests.reduce((map, test) => {
      const key = test.sampleId
      if (!map.has(key)) {
        map.set(key, {
          sampleId: test.sampleId,
          sampleCode: test.sample.sampleCode,
          categoryName: test.sample.category.name,
          categoryColor: test.sample.category.color,
          tests: [],
          dueAt: test.sample.dueAt,
        })
      }
      map.get(key)!.tests.push(test)
      return map
    }, new Map<number, SampleGroup>())
  ).values()

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

  const renderCard = (group: SampleGroup, isPending: boolean) => {
    const completedCount = group.tests.filter((t) => t.status === 'done').length
    const totalCount = group.tests.length
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    const statusBorderColor = isPending
      ? 'border-l-blue-500'
      : 'border-l-green-500'

    const statusBgColor = isPending ? 'bg-blue-50' : 'bg-green-50'

    const isOverdue = isPending && new Date(group.dueAt) < new Date()

    return (
      <div
        key={group.sampleId}
        className={`p-5 border-l-4 rounded-lg ${statusBorderColor} ${statusBgColor} h-full flex flex-col hover:shadow-md transition-all cursor-pointer`}
        onClick={() => !isPending && setShowCompleted(true)}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-lg text-gray-900 font-mono">{group.sampleCode}</h3>
            <span className="text-sm font-semibold text-gray-600">
              {completedCount}/{totalCount}
            </span>
          </div>
          <span
            className="font-medium inline-block px-2 py-1 rounded text-white text-xs"
            style={{ backgroundColor: group.categoryColor }}
          >
            {group.categoryName}
          </span>
        </div>

        {/* Tests List */}
        {totalCount > 0 && (
          <div className="mb-4 p-3 bg-white bg-opacity-50 rounded border border-gray-200 flex-1">
            <p className="text-xs font-semibold text-gray-700 mb-3">
              Tests ({completedCount}/{totalCount})
            </p>
            <div className="space-y-2">
              {group.tests.map((test) => (
                <div key={test.id}>
                  <div className="flex items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={test.status === 'done'}
                      onChange={() => {
                        if (test.status !== 'done') {
                          setExpandedTest(expandedTest === test.id ? null : test.id)
                        }
                      }}
                      className="w-4 h-4 mt-0.5 flex-shrink-0 accent-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium ${
                          test.status === 'done'
                            ? 'text-gray-600 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {test.test.name}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        Unit: <span className="font-mono">{test.test.unit}</span>
                      </p>
                      {test.status === 'done' && test.resultValue && (
                        <p className="text-gray-600 text-xs mt-1">
                          Result: <span className="font-semibold">{test.resultValue} {test.resultUnit}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Expanded Form */}
                  {expandedTest === test.id && test.status !== 'done' && (
                    <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded space-y-2 ml-6">
                      <div>
                        <Label htmlFor={`value-${test.id}`} className="text-xs">
                          Result Value *
                        </Label>
                        <Input
                          id={`value-${test.id}`}
                          type="text"
                          value={resultData[test.id]?.value || ''}
                          onChange={(e) =>
                            setResultData({
                              ...resultData,
                              [test.id]: {
                                ...resultData[test.id],
                                value: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g., 7.5"
                          autoFocus
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`unit-${test.id}`} className="text-xs">
                          Unit
                        </Label>
                        <Input
                          id={`unit-${test.id}`}
                          value={resultData[test.id]?.unit || test.test.unit}
                          onChange={(e) =>
                            setResultData({
                              ...resultData,
                              [test.id]: {
                                ...resultData[test.id],
                                unit: e.target.value,
                              },
                            })
                          }
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`method-${test.id}`} className="text-xs">
                          Method (Optional)
                        </Label>
                        <Input
                          id={`method-${test.id}`}
                          value={resultData[test.id]?.method || ''}
                          onChange={(e) =>
                            setResultData({
                              ...resultData,
                              [test.id]: {
                                ...resultData[test.id],
                                method: e.target.value,
                              },
                            })
                          }
                          className="text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleCompleteTest(test.id, test.sampleId)
                          }
                          disabled={
                            !resultData[test.id]?.value ||
                            completingTests.has(test.id)
                          }
                          size="sm"
                          className="text-xs"
                        >
                          {completingTests.has(test.id) ? 'Marking...' : 'Done'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedTest(null)}
                          disabled={completingTests.has(test.id)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  completionPercent === 100
                    ? 'bg-green-500'
                    : completionPercent >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                }`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {completionPercent}% complete
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-xs">
          <Badge variant="default" className="text-xs">
            {isPending ? 'Pending' : 'Done'}
          </Badge>
          <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {isOverdue ? 'Overdue' : 'On time'}
          </span>
        </div>
      </div>
    )
  }

  if (isLoading) return <div className="text-center py-12">Loading your queue...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Test Queue</h1>
        <p className="text-gray-600 mt-2">Tests assigned to you, organized by sample</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* PENDING SECTION */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Pending & In Progress{' '}
            <Badge variant={pendingTests.length > 0 ? 'warning' : 'success'}>
              {pendingTests.length}
            </Badge>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {pendingTests.length} / {allTests.length} tests remaining
          </p>
        </div>

        {pendingTests.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
            <p className="text-lg font-semibold text-green-700">
              ✅ All tests completed!
            </p>
            <p className="text-green-600 mt-2">Your samples are ready for review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
            {pendingSampleGroups.map((group) => renderCard(group, true))}
          </div>
        )}
      </div>

      {/* COMPLETED SECTION */}
      {completedTests.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-gray-50 border rounded-lg"
          >
            <h2 className="text-xl font-bold text-gray-900">
              ✓ Completed{' '}
              <Badge variant="success" className="ml-2">
                {completedTests.length}
              </Badge>
            </h2>
            <span className="text-gray-400 text-xl">
              {showCompleted ? '▼' : '▶'}
            </span>
          </button>

          {showCompleted && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
              {completedSampleGroups.map((group) => renderCard(group, false))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
