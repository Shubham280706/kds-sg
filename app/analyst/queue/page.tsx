'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { markTestInProgress, completeTest } from '@/lib/actions/samples'

interface SampleTest {
  id: number
  sampleId: number
  testId: number
  status: string
  assignedTo: number | null
  test: { id: number; name: string; unit: string }
  sample: { id: number; code: string; client: string; dueAt: Date }
}

export default function AnalystQueuePage() {
  const [tests, setTests] = useState<SampleTest[]>([])
  const [activeTest, setActiveTest] = useState<number | null>(null)
  const [resultData, setResultData] = useState({ value: '', unit: '', method: '' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch(`/api/analyst/queue`)
        if (response.ok) {
          const data = await response.json()
          setTests(data.tests || [])
        }
      } catch (error) {
        console.error('Failed to fetch tests:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTests()
  }, [])

  const handleStartTest = async (testId: number, sampleId: number) => {
    const result = await markTestInProgress(testId, sampleId)
    if (result.success) {
      setTests(tests.map((t) => (t.id === testId ? { ...t, status: 'in_progress' } : t)))
      setActiveTest(testId)
    }
  }

  const handleCompleteTest = async (testId: number, sampleId: number) => {
    const result = await completeTest(
      testId,
      sampleId,
      resultData.value,
      resultData.unit || tests.find((t) => t.id === testId)?.test.unit || '',
      resultData.method
    )
    if (result.success) {
      setTests(tests.map((t) => (t.id === testId ? { ...t, status: 'done' } : t)))
      setActiveTest(null)
      setResultData({ value: '', unit: '', method: '' })
    }
  }

  const pendingTests = tests.filter((t) => t.status !== 'done')
  const doneTests = tests.filter((t) => t.status === 'done')

  if (isLoading) return <div className="text-center py-12">Loading your queue...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Queue</h1>
        <p className="text-gray-600 mt-2">Your assigned tests</p>
      </div>

      {/* Pending Tests */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Pending Tests <Badge variant="warning">{pendingTests.length}</Badge>
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingTests.length === 0 ? (
            <p className="text-gray-500">No pending tests</p>
          ) : (
            pendingTests.map((st) => (
              <div key={st.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{st.sample.code}</h3>
                    <p className="text-sm text-gray-600">{st.sample.client}</p>
                  </div>
                  <Badge variant={st.status === 'in_progress' ? 'warning' : 'default'}>
                    {st.status}
                  </Badge>
                </div>

                <p className="font-medium text-gray-900 mb-4">{st.test.name}</p>

                {st.status === 'pending' && (
                  <Button onClick={() => handleStartTest(st.id, st.sampleId)} size="sm">
                    Start
                  </Button>
                )}

                {st.status === 'in_progress' && activeTest === st.id && (
                  <div className="space-y-3 mt-4 p-3 bg-gray-50 rounded">
                    <div>
                      <Label htmlFor={`value-${st.id}`}>Result Value *</Label>
                      <Input
                        id={`value-${st.id}`}
                        value={resultData.value}
                        onChange={(e) => setResultData({ ...resultData, value: e.target.value })}
                        placeholder="e.g., 7.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`unit-${st.id}`}>Unit</Label>
                      <Input
                        id={`unit-${st.id}`}
                        value={resultData.unit}
                        onChange={(e) => setResultData({ ...resultData, unit: e.target.value })}
                        placeholder={st.test.unit}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`method-${st.id}`}>Method (Optional)</Label>
                      <Input
                        id={`method-${st.id}`}
                        value={resultData.method}
                        onChange={(e) => setResultData({ ...resultData, method: e.target.value })}
                        placeholder="e.g., pH meter"
                      />
                    </div>
                    <Button
                      onClick={() => handleCompleteTest(st.id, st.sampleId)}
                      size="sm"
                      disabled={!resultData.value}
                    >
                      Mark Done
                    </Button>
                  </div>
                )}
              </div>
            ))
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
          <CardContent className="space-y-3">
            {doneTests.map((st) => (
              <div key={st.id} className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                <p className="font-medium">{st.sample.code} - {st.test.name}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
