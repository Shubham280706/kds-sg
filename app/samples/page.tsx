'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteSample } from '@/lib/actions/samples'

interface Sample {
  id: number
  sampleCode: string
  client: string
  category: { name: string }
  status: string
}

export default function SamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const fetchSamples = async () => {
    const res = await fetch('/api/samples')
    if (res.ok) setSamples((await res.json()).samples || [])
  }

  useEffect(() => {
    fetchSamples()
  }, [])

  const handleDelete = async (sampleId: number, sampleCode: string) => {
    if (!window.confirm(`Delete sample ${sampleCode}? This cannot be undone.`)) {
      return
    }

    setDeletingId(sampleId)
    setMessage('')

    try {
      const result = await deleteSample(sampleId)
      if (result.success) {
        setMessage(`✅ Sample ${sampleCode} deleted successfully`)
        setSamples(samples.filter((s) => s.id !== sampleId))
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } catch (error: any) {
      setMessage(`❌ ${error.message}`)
    } finally {
      setDeletingId(null)
    }
  }

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

      {message && (
        <div
          className={`p-4 rounded-lg text-sm ${
            message.startsWith('✅')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

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
                  <th className="text-left py-2 px-4">Actions</th>
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
                    <td className="py-3 px-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(s.id, s.sampleCode)}
                        disabled={deletingId === s.id}
                      >
                        {deletingId === s.id ? 'Deleting...' : 'Delete'}
                      </Button>
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
