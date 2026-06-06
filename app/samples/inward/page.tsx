'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createSample } from '@/lib/actions/samples'
import { getUsersByRole } from '@/lib/actions/users'

interface Category {
  id: number
  code: string
  name: string
  defaultTatHours: number
}

interface Test {
  id: number
  categoryId: number
  name: string
  unit: string
  defaultMethod: string | null
}

interface User {
  id: number
  name: string
  email: string
}

interface TestAssignment {
  testId: number
  assignedTo: number | null
}

export default function SampleInwardPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [analysts, setAnalysts] = useState<User[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  const [testAssignments, setTestAssignments] = useState<TestAssignment[]>([])

  useEffect(() => {
    const loadData = async () => {
      const [catRes, analystRes] = await Promise.all([
        fetch('/api/categories'),
        getUsersByRole('analyst'),
      ])
      if (catRes.ok) {
        const data = await catRes.json()
        setCategories(data.categories || [])
      }
      if (analystRes.success) {
        setAnalysts(analystRes.users || [])
      }
    }
    loadData()
  }, [])

  const handleCategoryChange = async (categoryId: string) => {
    setFormData({ ...formData, categoryId })

    if (!categoryId) {
      setTests([])
      setTestAssignments([])
      return
    }

    // Fetch tests for category
    const res = await fetch(`/api/categories/${categoryId}/tests`)
    if (res.ok) {
      const data = await res.json()
      setTests(data.tests || [])
      // Initialize test assignments
      const assignments = (data.tests || []).map((t: Test) => ({
        testId: t.id,
        assignedTo: null,
      }))
      setTestAssignments(assignments)
    }
  }

  const handleAssignAll = (analystId: number) => {
    setTestAssignments(
      testAssignments.map((ta) => ({
        ...ta,
        assignedTo: analystId,
      }))
    )
  }

  const handleTestAssignment = (testId: number, analystId: number | null) => {
    setTestAssignments(
      testAssignments.map((ta) =>
        ta.testId === testId ? { ...ta, assignedTo: analystId } : ta
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 1) {
      setStep(2)
      return
    }

    if (step === 2 && !formData.categoryId) {
      setMessage('❌ Please select a category')
      return
    }

    if (step === 2) {
      setStep(3)
      return
    }

    // Step 3 - Final submit
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
        testAssignments: testAssignments.map((ta) => ({
          testId: ta.testId,
          assignedTo: ta.assignedTo,
        })),
      })

      if (result.success) {
        // Redirect to confirmation
        router.push(
          `/samples/confirmation?id=${result.sampleId}&code=${result.sampleCode}`
        )
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } catch (error: any) {
      setMessage(`❌ ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === parseInt(formData.categoryId, 10))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Register Sample</h1>
        <p className="text-gray-600 mt-2">
          Step {step} of 3 • {step === 1 && 'Sample Details'} {step === 2 && 'Category & Tests'} {step === 3 && 'Assignment & Review'}
        </p>
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

      {/* Step 1: Sample Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Sample Details</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  Next: Select Category
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Category & Tests */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Select Category & View Tests</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
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

              {selectedCategory && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Tests for {selectedCategory.name}
                  </h3>
                  <Badge>{tests.length} tests will be attached</Badge>

                  <div className="mt-4 space-y-2">
                    {tests.map((test) => (
                      <div key={test.id} className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <p className="font-medium text-gray-900">{test.name}</p>
                        <p className="text-sm text-gray-600">{test.unit}</p>
                        {test.defaultMethod && (
                          <p className="text-xs text-gray-500">Method: {test.defaultMethod}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  ← Back
                </Button>
                <Button type="submit" disabled={isLoading || !formData.categoryId}>
                  Next: Assign Tests
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Test Assignment */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Assign Tests to Analysts</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {tests.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm font-medium text-gray-900">Quick assign all tests to:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleAssignAll(parseInt(e.target.value, 10))
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Select analyst...</option>
                      {analysts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-2">Test</th>
                      <th className="text-left py-2 px-2">Unit</th>
                      <th className="text-left py-2 px-2">Assign To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tests.map((test) => {
                      const assignment = testAssignments.find((ta) => ta.testId === test.id)
                      return (
                        <tr key={test.id}>
                          <td className="py-3 px-2 font-medium">{test.name}</td>
                          <td className="py-3 px-2">{test.unit}</td>
                          <td className="py-3 px-2">
                            <select
                              value={assignment?.assignedTo || ''}
                              onChange={(e) =>
                                handleTestAssignment(
                                  test.id,
                                  e.target.value ? parseInt(e.target.value, 10) : null
                                )
                              }
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Unassigned</option>
                              {analysts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={isLoading}
                >
                  ← Back
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Registering...' : 'Register Sample'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
