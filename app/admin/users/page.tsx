'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteUser, getAllUsers } from '@/lib/actions/users'
import { UserFormModal } from '@/components/UserFormModal'

interface User {
  id: number
  email: string
  name: string
  role: string
  active: boolean
}

const ROLES = ['admin', 'analyst', 'reviewer']

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

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

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleFormSuccess = async () => {
    // Reload users
    const result = await getAllUsers()
    if (result.success) {
      setUsers(result.users || [])
    }
    setMessage(editingUser ? '✅ User updated successfully' : '✅ User created successfully')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDelete = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure? This will deactivate ${userName}.`)) return

    setIsLoading(true)
    try {
      const result = await deleteUser(userId)
      if (result.success) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, active: false } : u)))
        setMessage('✅ User deactivated')
        setTimeout(() => setMessage(''), 3000)
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
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-2">Manage lab team members and their roles</p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null)
            setIsFormOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Add User
        </Button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 rounded-lg text-sm border ${
            message.startsWith('✅')
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <Label htmlFor="filterRole" className="text-sm font-medium block mb-2">
            Filter by Role
          </Label>
          <select
            id="filterRole"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="filterActive" className="text-sm font-medium block mb-2">
            Status
          </Label>
          <select
            id="filterActive"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No users match the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{user.email}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{user.name}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-blue-100 text-blue-800">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
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
                            onClick={() => handleDelete(user.id, user.name)}
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
          )}
        </CardContent>
      </Card>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingUser(null)
        }}
        onSuccess={handleFormSuccess}
        editingUser={editingUser}
      />
    </div>
  )
}
