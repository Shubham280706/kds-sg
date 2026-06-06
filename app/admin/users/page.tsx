'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createUser, updateUser, deleteUser, getAllUsers } from '@/lib/actions/users'

interface User {
  id: number
  email: string
  name: string
  role: string
  active: boolean
}

const ROLES = ['admin', 'analyst']

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'analyst',
    password: '',
  })

  useEffect(() => {
    const fetch = async () => {
      const result = await getAllUsers()
      if (result.success) {
        setUsers(result.users || [])
      }
      setIsLoading(false)
    }
    fetch()
  }, [])

  const resetForm = () => {
    setFormData({ email: '', name: '', role: 'analyst', password: '' })
    setEditingId(null)
    setIsFormOpen(false)
  }

  const handleEdit = (user: User) => {
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: '',
    })
    setEditingId(user.id)
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      if (editingId) {
        const result = await updateUser(editingId, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          active: true,
        })

        if (result.success) {
          setUsers(
            users.map((u) =>
              u.id === editingId
                ? {
                    ...u,
                    email: formData.email,
                    name: formData.name,
                    role: formData.role,
                  }
                : u
            )
          )
          setMessage('✅ User updated successfully')
        } else {
          setMessage(`❌ ${result.error}`)
        }
      } else {
        const result = await createUser(formData)

        if (result.success) {
          const newUser: User = {
            id: result.userId!,
            email: formData.email,
            name: formData.name,
            role: formData.role,
            active: true,
          }
          setUsers([...users, newUser])
          setMessage('✅ User created successfully')
        } else {
          setMessage(`❌ ${result.error}`)
        }
      }
      resetForm()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure? This will deactivate the user.')) return

    setIsLoading(true)
    try {
      const result = await deleteUser(userId)
      if (result.success) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, active: false } : u)))
        setMessage('✅ User deactivated')
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false
    if (filterActive === 'active' && !u.active) return false
    if (filterActive === 'inactive' && u.active) return false
    return true
  })

  if (isLoading && users.length === 0) {
    return <div className="text-center py-12">Loading users...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-2">Manage lab team members and their roles</p>
        </div>
        <Button onClick={() => { setIsFormOpen(true); setEditingId(null) }}>
          + Add User
        </Button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.startsWith('✅')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      {/* Add/Edit Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {editingId ? 'Edit User' : 'Add New User'}
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading || !!editingId}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="password">
                  Password {editingId && '(leave blank to keep current)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 8 characters"
                  disabled={isLoading}
                  required={!editingId}
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

      {/* Filters */}
      <div className="flex gap-4">
        <div>
          <Label htmlFor="filterRole">Filter by Role</Label>
          <select
            id="filterRole"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="filterActive">Status</Label>
          <select
            id="filterActive"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4 font-medium">{user.name}</td>
                    <td className="py-3 px-4">
                      <Badge>{user.role}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.active ? 'success' : 'default'}>
                        {user.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(user)}
                        disabled={isLoading}
                      >
                        Edit
                      </Button>
                      {user.active && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user.id)}
                          disabled={isLoading}
                        >
                          Deactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              No users match the selected filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
