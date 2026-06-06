'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { submitApproval } from '@/lib/actions/samples'

interface Sample {
  id: number
  code: string
  client: string
  sampleTests: Array<{ test: { name: string }; resultValue: string | null }>
}

export default function SignatoryQueuePage() {
  const [samples, setSamples] = useState<Sample[]>([])

  useEffect(() => {
    const fetchSamples = async () => {
      const res = await fetch('/api/signatory/queue')
      if (res.ok) setSamples((await res.json()).samples || [])
    }
    fetchSamples()
  }, [])

  const handleSignOff = async (sampleId: number) => {
    const result = await submitApproval(sampleId, true)
    if (result.success) {
      setSamples(samples.filter((s) => s.id !== sampleId))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sign-off Queue</h1>
        <p className="text-gray-600 mt-2">Final approval before reporting</p>
      </div>

      {samples.map((sample) => (
        <Card key={sample.id}>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <h2 className="font-semibold">{sample.code}</h2>
                <p className="text-sm text-gray-600">{sample.client}</p>
              </div>
              <Badge variant="success">Ready to Report</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Results Summary:</h3>
              <ul className="space-y-1 text-sm">
                {sample.sampleTests.map((st, i) => (
                  <li key={i}>
                    • {st.test.name}: {st.resultValue || 'N/A'}
                  </li>
                ))}
              </ul>
            </div>
            <Button onClick={() => handleSignOff(sample.id)}>Sign Off & Report</Button>
          </CardContent>
        </Card>
      ))}

      {samples.length === 0 && <p className="text-center text-gray-500 py-12">No samples to sign off</p>}
    </div>
  )
}
