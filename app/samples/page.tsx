'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Sample {
  id: number
  sampleCode: string
  client: string
  category: { name: string }
  status: string
}

export default function SamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([])

  useEffect(() => {
    const fetchSamples = async () => {
      const res = await fetch('/api/samples')
      if (res.ok) setSamples((await res.json()).samples || [])
    }
    fetchSamples()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Samples</h1>
          <p className="text-gray-600 mt-2">Register and manage samples</p>
        </div>
        <Link href="/samples/inward">
          <Button>+ New Sample</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-4">Sample Code</th>
                  <th className="text-left py-2 px-4">Client</th>
                  <th className="text-left py-2 px-4">Category</th>
                  <th className="text-left py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {samples.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">
                      <Link href={`/samples/${s.id}`} className="text-blue-600 hover:underline">
                        {s.sampleCode}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{s.client}</td>
                    <td className="py-3 px-4">{s.category.name}</td>
                    <td className="py-3 px-4">
                      <Badge>{s.status.replace(/_/g, ' ')}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
