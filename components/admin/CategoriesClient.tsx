'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/categories'

interface Category {
  id: number
  code: string
  name: string
  defaultTatHours: number
  color: string
  active: boolean
}

export function CategoriesClient({ initialData }: { initialData: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialData)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ code: '', name: '', defaultTatHours: 48, color: '#1D9E75' })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setFormData({ code: '', name: '', defaultTatHours: 48, color: '#1D9E75' })
    setEditingId(null)
    setIsFormOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      if (editingId) {
        const result = await updateCategory(editingId, formData)
        if (result.success) {
          setCategories(
            categories.map((c) => (c.id === editingId ? { ...c, ...formData } : c))
          )
          setMessage('Category updated successfully')
        } else {
          setMessage(`Error: ${result.error}`)
        }
      } else {
        const result = await createCategory(formData)
        if (result.success) {
          setCategories([
            ...categories,
            {
              id: result.id!,
              ...formData,
              active: true,
            },
          ])
          setMessage('Category created successfully')
        } else {
          setMessage(`Error: ${result.error}`)
        }
      }
      resetForm()
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setFormData({
      code: category.code,
      name: category.name,
      defaultTatHours: category.defaultTatHours,
      color: category.color,
    })
    setEditingId(category.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    setIsLoading(true)
    try {
      const result = await deleteCategory(id)
      if (result.success) {
        setCategories(categories.filter((c) => c.id !== id))
        setMessage('Category deleted successfully')
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
        <div className={`p-3 rounded-lg text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {message}
        </div>
      )}

      <Button onClick={() => { setIsFormOpen(true); setEditingId(null) }}>
        + Add Category
      </Button>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., WW"
                    disabled={isLoading || !!editingId}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Wastewater"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tat">Default TAT (hours)</Label>
                  <Input
                    id="tat"
                    type="number"
                    value={formData.defaultTatHours}
                    onChange={(e) => setFormData({ ...formData, defaultTatHours: parseInt(e.target.value) })}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      disabled={isLoading}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#1D9E75"
                      disabled={isLoading}
                      className="flex-1"
                    />
                  </div>
                </div>
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
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Code</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Default TAT</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Color</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{category.code}</td>
                <td className="px-4 py-3 text-gray-900">{category.name}</td>
                <td className="px-4 py-3 text-gray-600">{category.defaultTatHours}h</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-gray-600 text-xs">{category.color}</span>
                  </div>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(category)}
                    disabled={isLoading}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(category.id)}
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {categories.length === 0 && !isFormOpen && (
        <div className="text-center py-12">
          <p className="text-gray-600">No categories yet. Create one to get started.</p>
        </div>
      )}
    </div>
  )
}
