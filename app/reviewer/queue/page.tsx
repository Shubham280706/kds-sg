'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { submitReview } from '@/lib/actions/samples'

interface Sample {
  id: number
  code: string
  client: string
  sampleTests: Array<{ id: number; test: { name: string }; resultValue: string | null }>
}

export default function ReviewerQueuePage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [activeModal, setActiveModal] = useState<{ sampleId: number; reason: string } | null>(null)

  useEffect(() => {
    const fetchSamples = async () => {
      const res = await fetch('/api/reviewer/queue')
      if (res.ok) setSamples((await res.json()).samples || [])
    }
    fetchSamples()
  }, [])

  const handleApprove = async (sampleId: number) => {
    const result = await submitReview(sampleId, true)
    if (result.success) {
      setSamples(samples.filter((s) => s.id !== sampleId))
    }
  }

  const handleReject = async (sampleId: number) => {
    if (!activeModal || activeModal.sampleId !== sampleId) return
    const result = await submitReview(sampleId, false, activeModal.reason)
    if (result.success) {
      setSamples(samples.filter((s) => s.id !== sampleId))
      setActiveModal(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Queue</h1>
        <p className="text-gray-600 mt-2">Approve or reject completed analyses</p>
      </div>

      {samples.map((sample) => (
        <Card key={sample.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold">{sample.code}</h2>
                <p className="text-sm text-gray-600">{sample.client}</p>
              </div>
              <Badge>Under Review</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Test Results:</h3>
              <ul className="space-y-1 text-sm">
                {sample.sampleTests.map((st) => (
                  <li key={st.id}>
                    • {st.test.name}: {st.resultValue || 'No result'}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => handleApprove(sample.id)} size="sm">
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setActiveModal({ sampleId: sample.id, reason: '' })}
                size="sm"
              >
                Reject
              </Button>
            </div>

            {activeModal?.sampleId === sample.id && (
              <div className="p-3 bg-red-50 rounded space-y-2">
                <Label>Rejection Reason</Label>
                <textarea
                  value={activeModal.reason}
                  onChange={(e) =>
                    setActiveModal({ ...activeModal, reason: e.target.value })
                  }
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="Enter reason..."
                />
                <Button
                  size="sm"
                  onClick={() => handleReject(sample.id)}
                  disabled={!activeModal.reason}
                >
                  Confirm Rejection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {samples.length === 0 && <p className="text-center text-gray-500 py-12">No samples to review</p>}
    </div>
  )
}
