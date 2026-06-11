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

interface User {
  id: number
  name: string
  email: string
}

interface TestAssignment {
  testName: string
  assignedTo: number | null
}

export default function SampleInwardPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [analysts, setAnalysts] = useState<User[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    client: '',
    source: '',
    samplingAt: new Date().toISOString().split('T')[0],
    receivedAt: new Date().toISOString().split('T')[0],
    dueAt: (() => {
      const date = new Date()
      date.setDate(date.getDate() + 3)
      return date.toISOString().split('T')[0]
    })(),
    categoryId: '',
    quantity: '',
    condition: '',
    remarks: '',
  })

  const [testInput, setTestInput] = useState('')
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

  const handleCategoryChange = (categoryId: string) => {
    setFormData({ ...formData, categoryId })
  }

  const handleAddTest = (testName: string) => {
    const trimmed = testName.trim()
    if (trimmed && !testAssignments.find(ta => ta.testName === trimmed)) {
      setTestAssignments([...testAssignments, { testName: trimmed, assignedTo: null }])
      setTestInput('')
    }
  }

  const handleRemoveTest = (testName: string) => {
    setTestAssignments(testAssignments.filter(ta => ta.testName !== testName))
  }

  const handleAssignAll = (analystId: number) => {
    setTestAssignments(
      testAssignments.map((ta) => ({
        ...ta,
        assignedTo: analystId,
      }))
    )
  }

  const handleTestAssignment = (idx: number, analystId: number | null) => {
    setTestAssignments(
      testAssignments.map((ta, i) =>
        i === idx ? { ...ta, assignedTo: analystId } : ta
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
        dueAt: formData.dueAt,
        categoryId: parseInt(formData.categoryId, 10),
        quantity: formData.quantity || undefined,
        condition: formData.condition || undefined,
        remarks: formData.remarks || undefined,
        testAssignments: testAssignments.map((ta) => ({
          testName: ta.testName,
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
                <Label htmlFor="source">Sample Name</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., River Water, Effluent Sample"
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

              <div>
                <Label htmlFor="dueAt">Due Date (Deadline) *</Label>
                <Input
                  id="dueAt"
                  type="date"
                  value={formData.dueAt}
                  onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">Default is 3 days from today</p>
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
                <div className="pt-4 border-t space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Add Tests</h3>
                    <div className="flex gap-2">
                      <Input
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTest(testInput)
                          }
                        }}
                        placeholder="Type test name e.g. pH, BOD, COD..."
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        onClick={() => handleAddTest(testInput)}
                        disabled={isLoading || !testInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {testAssignments.length > 0 && (
                    <div>
                      <Badge className="mb-3">{testAssignments.length} test(s) added</Badge>
                      <div className="flex flex-wrap gap-2">
                        {testAssignments.map((ta) => (
                          <div
                            key={ta.testName}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {ta.testName}
                            <button
                              type="button"
                              onClick={() => handleRemoveTest(ta.testName)}
                              className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {testAssignments.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Add at least one test to proceed</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-400 text-gray-800 bg-white rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  ← Back
                </button>
                <Button type="submit" disabled={isLoading || !formData.categoryId || testAssignments.length === 0}>
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
              {testAssignments.length > 0 && (
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
                      <th className="text-left py-2 px-2">Assign To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {testAssignments.map((ta, idx) => (
                      <tr key={`${ta.testName}-${idx}`}>
                        <td className="py-3 px-2 font-medium">{ta.testName}</td>
                        <td className="py-3 px-2">
                          <select
                            value={ta.assignedTo || ''}
                            onChange={(e) =>
                              handleTestAssignment(
                                idx,
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
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                {testAssignments.some(ta => ta.assignedTo === null) && (
                  <p className="text-xs text-amber-600 font-medium">
                    ℹ️ All tests must be assigned to an analyst before registering
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-400 text-gray-800 bg-white rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    ← Back
                  </button>
                  <Button
                    type="submit"
                    disabled={isLoading || testAssignments.some(ta => ta.assignedTo === null)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      testAssignments.some(ta => ta.assignedTo === null)
                        ? 'bg-blue-300 text-white cursor-not-allowed opacity-60'
                        : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    }`}
                  >
                    {isLoading ? 'Registering...' : 'Register Sample'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
