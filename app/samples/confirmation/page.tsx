'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSampleDetail } from '@/lib/actions/samples'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SampleDetail {
  id: number
  code: string
  client: string
  category: { name: string; code: string }
  samplingAt: Date
  receivedAt: Date
  quantity: string | null
  condition: string | null
  sampleTests: Array<{
    id: number
    test: { name: string; unit: string }
    assignedToUser: { name: string } | null
  }>
}

export default function ConfirmationPage() {
  const router = useRouter()
  const params = useSearchParams()
  const sampleId = params.get('id')

  const [sample, setSample] = useState<SampleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!sampleId) return

    const fetch = async () => {
      const result = await getSampleDetail(parseInt(sampleId, 10))
      if (result.success) {
        setSample(result.sample as any)
      }
      setIsLoading(false)
    }
    fetch()
  }, [sampleId])

  if (isLoading) return <div className="text-center py-12">Loading...</div>
  if (!sample) return <div className="text-center py-12">Sample not found</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success Banner */}
      <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="text-3xl">✅</div>
          <div>
            <h1 className="text-2xl font-bold text-green-900">Sample Registered Successfully!</h1>
            <p className="text-green-700">Sample is now in the system and ready for analysis.</p>
          </div>
        </div>
      </div>

      {/* Sample Info Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{sample.code}</h2>
              <p className="text-gray-600 mt-1">{sample.client}</p>
            </div>
            <Badge variant="default">{sample.category.code}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-medium text-gray-900 mt-1">{sample.category.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sampling Date</p>
              <p className="font-medium text-gray-900 mt-1">
                {new Date(sample.samplingAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Received Date</p>
              <p className="font-medium text-gray-900 mt-1">
                {new Date(sample.receivedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quantity</p>
              <p className="font-medium text-gray-900 mt-1">{sample.quantity || '-'}</p>
            </div>
          </div>

          {sample.condition && (
            <div>
              <p className="text-sm text-gray-600">Condition</p>
              <p className="font-medium text-gray-900 mt-1">{sample.condition}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tests Assigned</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Test Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Unit</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sample.sampleTests.map((st) => (
                    <tr key={st.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{st.test.name}</td>
                      <td className="py-3 px-4 text-gray-600">{st.test.unit}</td>
                      <td className="py-3 px-4">
                        {st.assignedToUser ? (
                          <Badge variant="success">{st.assignedToUser.name}</Badge>
                        ) : (
                          <span className="text-gray-500 text-sm">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button onClick={() => router.push('/dashboard')}>📊 Back to Board</Button>
        <Button variant="outline" onClick={() => router.push('/samples/inward')}>
          + Register Another
        </Button>
        <Button variant="outline" onClick={() => router.push(`/samples/${sample.id}`)}>
          View Details
        </Button>
      </div>
    </div>
  )
}
