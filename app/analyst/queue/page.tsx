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
  sample: { id: number; code: string; client: string; dueAt: Date }
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
        <p className="text-gray-600 mt-2">Tests assigned to you</p>
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
              <p className="font-medium text-gray-900">Progress</p>
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

      {/* Pending Tests */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Pending{' '}
            <Badge variant={pendingTests.length > 0 ? 'warning' : 'default'}>
              {pendingTests.length}
            </Badge>
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingTests.length === 0 ? (
            <p className="text-gray-500">No pending tests</p>
          ) : (
            pendingTests.map((st) => {
              const isCompleting = completingTests.has(st.id)
              const isDone = st.status === 'done'

              return (
                <div
                  key={st.id}
                  className={`border rounded-lg transition-all ${
                    isDone ? 'bg-green-50 border-green-200' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {/* Clickable Checkbox Row */}
                  <div
                    className={`p-4 cursor-pointer flex items-center gap-4 ${
                      expandedTest === st.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() =>
                      !isDone && setExpandedTest(expandedTest === st.id ? null : st.id)
                    }
                  >
                    {/* Animated Checkbox */}
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        className={`w-5 h-5 cursor-pointer transition-all ${
                          isDone
                            ? 'accent-green-600'
                            : 'accent-blue-600'
                        }`}
                        disabled={isDone}
                      />
                    </div>

                    {/* Test Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold ${
                          isDone
                            ? 'text-gray-600 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {st.test.name} — {st.test.unit}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {st.sample.code} · {st.sample.client}
                      </p>
                    </div>

                    {/* Expand Indicator */}
                    {!isDone && (
                      <span className="text-gray-400 text-lg">
                        {expandedTest === st.id ? '▼' : '▶'}
                      </span>
                    )}
                  </div>

                  {/* Expanded Form */}
                  {expandedTest === st.id && !isDone && (
                    <div className="p-4 border-t bg-white space-y-4 animate-in slide-in-from-top">
                      <div>
                        <Label htmlFor={`value-${st.id}`}>Result Value *</Label>
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
                          value={resultData[st.id]?.unit || st.test.unit}
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
                        <Label htmlFor={`method-${st.id}`}>Method (Optional)</Label>
                        <Input
                          id={`method-${st.id}`}
                          value={resultData[st.id]?.method || ''}
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
                          onClick={() => handleCompleteTest(st.id, st.sampleId)}
                          disabled={!resultData[st.id]?.value || isCompleting}
                          size="sm"
                        >
                          {isCompleting ? 'Marking...' : 'Mark as Done'}
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
            })
          )}
        </CardContent>
      </Card>

      {/* Completed Tests */}
      {doneTests.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Completed <Badge variant="success">{doneTests.length}</Badge>
            </h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {doneTests.map((st) => (
              <div
                key={st.id}
                className="p-3 bg-green-50 border border-green-200 rounded flex items-center gap-3"
              >
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="cursor-default accent-green-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 line-through text-gray-600">
                    {st.test.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {st.resultValue} {st.resultUnit || st.test.unit}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
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
