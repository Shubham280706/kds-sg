'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createSample } from '@/lib/actions/samples'
import { useEffect } from 'react'

interface Category {
  id: number
  code: string
  name: string
  defaultTatHours: number
}

export default function SampleInwardPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    client: '',
    source: '',
    samplingAt: new Date().toISOString().split('T')[0],
    receivedAt: new Date().toISOString().split('T')[0],
    categoryId: '',
    quantity: '',
    condition: '',
    remarks: '',
  })

  useEffect(() => {
    // Fetch categories
    const fetchCategories = async () => {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
        if (data.categories?.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id.toString() }))
        }
      }
    }
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const result = await createSample({
        client: formData.client,
        source: formData.source || undefined,
        samplingAt: formData.samplingAt,
        receivedAt: formData.receivedAt,
        categoryId: parseInt(formData.categoryId, 10),
        quantity: formData.quantity || undefined,
        condition: formData.condition || undefined,
        remarks: formData.remarks || undefined,
      })

      if (result.success) {
        setMessage(`✅ Sample ${result.sampleCode} registered successfully`)
        setTimeout(() => router.push('/samples'), 2000)
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } catch (error: any) {
      setMessage(`❌ ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Register Sample</h1>
        <p className="text-gray-600 mt-2">Add a new sample for testing</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.startsWith('✅')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Sample Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client">Client *</Label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  placeholder="Client name"
                  disabled={isLoading}
                  required
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  disabled={isLoading}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.code} - {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g., Pipe outlet, River near bridge"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="samplingAt">Sampling Date *</Label>
                <Input
                  id="samplingAt"
                  type="date"
                  value={formData.samplingAt}
                  onChange={(e) => setFormData({ ...formData, samplingAt: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <Label htmlFor="receivedAt">Received Date *</Label>
                <Input
                  id="receivedAt"
                  type="date"
                  value={formData.receivedAt}
                  onChange={(e) => setFormData({ ...formData, receivedAt: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g., 500ml, 1L"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Input
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  placeholder="e.g., Clear, Good"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Additional notes"
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Register Sample'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
