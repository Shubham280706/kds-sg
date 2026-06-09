'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createTest, updateTest, deleteTest } from '@/lib/actions/tests'

interface Test {
  id: number
  categoryId: number | null
  name: string
  unit: string
  defaultMethod: string | null
  active: boolean
}

interface Category {
  id: number
  code: string
  name: string
}

export function TestsClient({ initialTests, initialCategories = [] }: { initialTests: Test[], initialCategories?: Category[] }) {
  const [tests, setTests] = useState<Test[]>(initialTests)
  const [categories] = useState<Category[]>(initialCategories)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(initialCategories[0]?.id || 0)
  const [formData, setFormData] = useState({ name: '', unit: '', defaultMethod: '' })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setFormData({ name: '', unit: '', defaultMethod: '' })
    setEditingId(null)
    setIsFormOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      if (editingId) {
        const result = await updateTest(editingId, formData)
        if (result.success) {
          setTests(tests.map((t) => (t.id === editingId ? { ...t, ...formData } : t)))
          setMessage('Test updated successfully')
        } else {
          setMessage(`Error: ${result.error}`)
        }
      } else {
        const result = await createTest({ ...formData, categoryId: selectedCategoryId })
        if (result.success) {
          setTests([
            ...tests,
            {
              id: result.id!,
              categoryId: selectedCategoryId,
              ...formData,
              active: true,
            },
          ])
          setMessage('Test created successfully')
        } else {
          setMessage(`Error: ${result.error}`)
        }
      }
      resetForm()
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (test: Test) => {
    setFormData({
      name: test.name,
      unit: test.unit,
      defaultMethod: test.defaultMethod || '',
    })
    setEditingId(test.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (testId: number) => {
    if (!confirm('Are you sure you want to delete this test?')) return

    setIsLoading(true)
    try {
      const result = await deleteTest(testId)
      if (result.success) {
        setTests(tests.filter((t) => t.id !== testId))
        setMessage('Test deleted successfully')
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.startsWith('Error')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}
        >
          {message}
        </div>
      )}

      <Button onClick={() => { setIsFormOpen(true); setEditingId(null) }} disabled={isLoading}>
        + Add Test
      </Button>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Test' : 'Add New Test'}</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(parseInt(e.target.value, 10))}
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
              )}

              <div>
                <Label htmlFor="name">Test Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., pH"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., pH units"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="method">Default Method (Optional)</Label>
                <Input
                  id="method"
                  value={formData.defaultMethod}
                  onChange={(e) => setFormData({ ...formData, defaultMethod: e.target.value })}
                  placeholder="e.g., Standard Method 4500-H+ B"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Unit</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Default Method</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tests.map((test) => (
              <tr key={test.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{test.name}</td>
                <td className="px-4 py-3 text-gray-600">{test.unit}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{test.defaultMethod || '-'}</td>
                <td className="px-4 py-3 space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(test)} disabled={isLoading}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(test.id)} disabled={isLoading}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tests.length === 0 && !isFormOpen && (
        <div className="text-center py-12">
          <p className="text-gray-600">No tests yet. Create one to get started.</p>
        </div>
      )}
    </div>
  )
}
