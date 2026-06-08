'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { completeTest } from '@/lib/actions/samples'

interface Test {
  id: number
  testId: number
  sampleId: number
  status: string
  resultValue: string | null
  resultUnit: string | null
  method: string | null
  doneAt: Date | null
  revisionReason: string | null
  test: {
    id: number
    name: string
    unit: string
  }
  sample: {
    sampleCode: string
    dueAt: Date
    category: {
      name: string
      color: string
    }
  }
}

interface SampleCardData {
  sampleId: number
  sampleCode: string
  categoryName: string
  categoryColor: string
  dueAt: Date
  revisionReason: string | null
  tests: Test[]
}

export default function AnalystQueuePage() {
  const [allTests, setAllTests] = useState<Test[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedTest, setExpandedTest] = useState<number | null>(null)
  const [resultData, setResultData] = useState<Record<number, { value: string; unit: string; method: string }>>({})
  const [completingTests, setCompletingTests] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`/api/analyst/queue`)
        if (res.ok) {
          const data = await res.json()
          setAllTests(data.tests || [])
        }
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to fetch tests:', err)
        setIsLoading(false)
      }
    }

    fetchTests()
    const interval = setInterval(fetchTests, 3000)
    return () => clearInterval(interval)
  }, [])

  // Group tests by sample (simple forEach approach)
  const groupedSamples: Record<number, SampleCardData> = {}

  allTests.forEach((test) => {
    const key = test.sampleId
    if (!groupedSamples[key]) {
      groupedSamples[key] = {
        sampleId: test.sampleId,
        sampleCode: test.sample?.sampleCode || `Sample ${key}`,
        categoryName: test.sample?.category?.name || 'Unknown',
        categoryColor: test.sample?.category?.color || '#3B82F6',
        dueAt: test.sample?.dueAt || new Date(),
        revisionReason: test.revisionReason || null,
        tests: [],
      }
    }
    groupedSamples[key].tests.push(test)
  })

  // Convert to array and sort by due date
  const allSampleCards = Object.values(groupedSamples).sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  )

  // Split into pending and completed
  const pendingSamples = allSampleCards.filter((s) =>
    s.tests.some((t) => t.status !== 'done')
  )
  const completedSamples = allSampleCards.filter((s) =>
    s.tests.every((t) => t.status === 'done')
  )

  const totalTests = allTests.length
  const completedTestsCount = allTests.filter((t) => t.status === 'done').length
  const pendingTestsCount = totalTests - completedTestsCount

  const handleCompleteTest = async (testId: number, sampleId: number) => {
    const data = resultData[testId]
    if (!data?.value) {
      setError('Please enter a result value')
      return
    }

    setCompletingTests((prev) => new Set(prev).add(testId))
    setError('')

    try {
      const testObj = allTests.find((t) => t.id === testId)
      const result = await completeTest(
        testId,
        sampleId,
        data.value,
        data.unit || testObj?.test?.unit || '',
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

  const SampleCard = ({ sample }: { sample: SampleCardData }) => {
    const testsDone = sample.tests.filter((t) => t.status === 'done').length
    const totalTests = sample.tests.length
    const progressPercent = totalTests > 0 ? Math.round((testsDone / totalTests) * 100) : 0
    const isOverdue = new Date(sample.dueAt) < new Date()

    const borderColor =
      testsDone === totalTests ? '#10B981' : sample.categoryColor

    return (
      <div
        className="p-5 rounded-lg border-l-4 transition-all hover:shadow-md relative"
        style={{
          borderLeftColor: borderColor,
          backgroundColor: testsDone === totalTests ? '#F0FDF4' : '#F8FAFC',
          borderRight: '1px solid #E5E7EB',
          borderTop: '1px solid #E5E7EB',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        {/* Revision Badge */}
        {sample.revisionReason && (
          <div
            className="absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-white text-xs font-bold uppercase"
            style={{ backgroundColor: '#e74c3c' }}
          >
            ↻ Revision
          </div>
        )}

        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg font-mono text-gray-900">
              {sample.sampleCode}
            </h3>
            <span
              className="inline-block px-2 py-1 mt-2 rounded text-white text-xs font-medium"
              style={{ backgroundColor: sample.categoryColor }}
            >
              {sample.categoryName}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Tests</p>
            <p className="text-lg font-bold text-gray-900">
              {testsDone}/{totalTests}
            </p>
          </div>
        </div>

        {/* Revision Feedback */}
        {sample.revisionReason && (
          <div className="mb-4 p-3 rounded border-l-4" style={{ backgroundColor: '#fadbd8', borderLeftColor: '#e74c3c' }}>
            <p className="text-xs font-bold text-red-800 mb-1">Reviewer Feedback:</p>
            <p className="text-xs text-red-700 leading-relaxed">{sample.revisionReason}</p>
          </div>
        )}

        {/* Tests List */}
        {totalTests > 0 && (
          <div className="mb-4 p-3 bg-white bg-opacity-50 rounded border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-3">
              Tests ({testsDone}/{totalTests})
            </p>
            <div className="space-y-2">
              {sample.tests.map((test) => (
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
                      className="w-4 h-4 mt-0.5 flex-shrink-0 cursor-pointer accent-blue-600"
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
                          <span className="font-semibold">
                            {test.resultValue} {test.resultUnit || test.test.unit}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Inline Result Form */}
                  {expandedTest === test.id && test.status !== 'done' && (
                    <div className="mt-2 ml-6 p-3 bg-blue-100 border border-blue-200 rounded space-y-2">
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
                          className="text-xs"
                          autoFocus
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
                          onClick={() => handleCompleteTest(test.id, test.sampleId)}
                          disabled={!resultData[test.id]?.value || completingTests.has(test.id)}
                          size="sm"
                          className="text-xs"
                        >
                          {completingTests.has(test.id) ? 'Marking...' : 'Done'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedTest(null)}
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
        {totalTests > 0 && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  progressPercent === 100
                    ? 'bg-green-500'
                    : progressPercent >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">{progressPercent}% complete</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-xs">
          <Badge variant="default" className="text-xs">
            {testsDone === totalTests ? 'Done' : 'Pending'}
          </Badge>
          <span className={isOverdue && testsDone < totalTests ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {isOverdue && testsDone < totalTests ? 'Overdue' : 'On time'}
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
            <Badge variant={pendingTestsCount > 0 ? 'warning' : 'success'}>
              {pendingTestsCount}
            </Badge>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {pendingTestsCount} / {totalTests} tests remaining
          </p>
        </div>

        {/* Progress Bar */}
        {totalTests > 0 && (
          <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all"
                style={{ width: `${((totalTests - pendingTestsCount) / totalTests) * 100}%` }}
              />
            </div>
          </div>
        )}

        {pendingTestsCount === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
            <p className="text-lg font-semibold text-green-700">✅ All tests completed!</p>
            <p className="text-green-600 mt-2">Your samples are ready for review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
            {pendingSamples.map((sample) => (
              <SampleCard key={sample.sampleId} sample={sample} />
            ))}
          </div>
        )}
      </div>

      {/* COMPLETED SECTION */}
      {completedSamples.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-gray-50 border rounded-lg"
          >
            <h2 className="text-xl font-bold text-gray-900">
              ✓ Completed{' '}
              <Badge variant="success" className="ml-2">
                {completedSamples.length}
              </Badge>
            </h2>
            <span className="text-gray-400 text-xl">{showCompleted ? '▼' : '▶'}</span>
          </button>

          {showCompleted && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
              {completedSamples.map((sample) => (
                <SampleCard key={sample.sampleId} sample={sample} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
