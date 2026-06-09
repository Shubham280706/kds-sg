'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSampleDetail } from '@/lib/actions/samples'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Sample {
  id: number
  code: string
  client: string
  source: string | null
  samplingAt: Date
  receivedAt: Date
  quantity: string | null
  condition: string | null
  remarks: string | null
  status: string
  dueAt: Date | null
  createdAt: Date
  category: { id: number; name: string; code: string; color: string }
  sampleTests: Array<{
    id: number
    testId: number
    status: string
    resultValue: string | null
    resultUnit: string | null
    method: string | null
    doneAt: Date | null
    test: { id: number; name: string; unit: string; defaultMethod: string | null }
    assignedToUser: { id: number; name: string; email: string } | null
  }>
}

interface StatusEvent {
  id: number
  fromStatus: string
  toStatus: string
  note: string | null
  createdAt: Date
  byUser: { id: number; name: string; email: string }
}

export default function SampleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [sample, setSample] = useState<Sample | null>(null)
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      const result = await getSampleDetail(parseInt(params.id as string, 10))
      if (result.success) {
        setSample(result.sample as any)
        setEvents(result.events as StatusEvent[])
      }
      setIsLoading(false)
    }
    fetchDetail()
  }, [params.id])

  if (isLoading) return <div className="text-center py-12">Loading...</div>
  if (!sample) return <div className="text-center py-12">Sample not found</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{sample.code}</h1>
          <p className="text-gray-600 mt-2">{sample.client}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      {/* Sample Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Sample Information</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: sample.category.color }}
                />
                <span className="font-medium">{sample.category.name}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant="default" className="mt-1">
                {sample.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Source</p>
              <p className="font-medium">{sample.source || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quantity</p>
              <p className="font-medium">{sample.quantity || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sampling Date</p>
              <p className="font-medium">{new Date(sample.samplingAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Received Date</p>
              <p className="font-medium">{new Date(sample.receivedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              {sample.dueAt ? (
                <div className="mt-1">
                  {(() => {
                    const now = new Date()
                    const dueDate = new Date(sample.dueAt)
                    const timeDiff = dueDate.getTime() - now.getTime()
                    const hoursRemaining = timeDiff / (1000 * 60 * 60)

                    let textColor = 'text-green-600'
                    let label = '✓ On Time'

                    if (timeDiff < 0) {
                      textColor = 'text-red-600'
                      label = '⚠ Overdue'
                    } else if (hoursRemaining < 24) {
                      textColor = 'text-amber-600'
                      label = '⚡ Due Soon'
                    }

                    return (
                      <div>
                        <p className={`font-medium ${textColor}`}>{dueDate.toLocaleDateString()}</p>
                        <p className={`text-xs ${textColor} mt-0.5`}>{label}</p>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <p className="font-medium text-gray-500">-</p>
              )}
            </div>
          </div>
          {sample.remarks && (
            <div>
              <p className="text-sm text-gray-600">Remarks</p>
              <p className="font-medium">{sample.remarks}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tests */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Tests</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2">Test</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Result</th>
                  <th className="text-left py-2 px-2">Analyst</th>
                  <th className="text-left py-2 px-2">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sample.sampleTests.map((st) => (
                  <tr key={st.id}>
                    <td className="py-3 px-2 font-medium">{st.test.name}</td>
                    <td className="py-3 px-2">
                      <Badge variant={st.status === 'done' ? 'success' : 'default'}>
                        {st.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      {st.resultValue ? `${st.resultValue} ${st.resultUnit || st.test.unit}` : '-'}
                    </td>
                    <td className="py-3 px-2">{st.assignedToUser?.name || '-'}</td>
                    <td className="py-3 px-2">
                      {st.doneAt ? new Date(st.doneAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Timeline</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-gray-500">No events yet</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="pb-4 border-b last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {event.fromStatus} → {event.toStatus}
                      </p>
                      <p className="text-sm text-gray-600">{event.byUser.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {event.note && (
                    <p className="text-sm text-gray-700 mt-2 italic">
                      &quot;{event.note}&quot;
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
