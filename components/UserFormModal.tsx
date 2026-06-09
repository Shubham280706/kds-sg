'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUser, updateUser } from '@/lib/actions/users'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingUser?: {
    id: number
    email: string
    name: string
    role: string
  } | null
}

export function UserFormModal({ isOpen, onClose, onSuccess, editingUser }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'analyst',
    password: '',
    active: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(
    null
  )

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setFormData({
          email: editingUser.email,
          name: editingUser.name,
          role: editingUser.role,
          password: '',
          active: true,
        })
      } else {
        setFormData({
          email: '',
          name: '',
          role: 'analyst',
          password: '',
          active: true,
        })
      }
      setErrors({})
      setPasswordStrength(null)
    }
  }, [isOpen, editingUser])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    // Password validation (required only on create)
    if (!editingUser && !formData.password) {
      newErrors.password = 'Password is required'
    }
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(null)
      return
    }

    if (password.length < 8) {
      setPasswordStrength('weak')
    } else if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordStrength('medium')
    } else {
      setPasswordStrength('strong')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Check password strength
    if (field === 'password') {
      checkPasswordStrength(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      if (editingUser) {
        const updateData: any = {
          name: formData.name,
          role: formData.role,
          active: formData.active,
        }
        if (formData.password) {
          updateData.password = formData.password
        }
        const result = await updateUser(editingUser.id, updateData)
        if (!result.success) {
          setErrors({ submit: result.error || 'Failed to update user' })
          setIsLoading(false)
          return
        }
      } else {
        const result = await createUser({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          password: formData.password,
        })
        if (!result.success) {
          setErrors({ submit: result.error || 'Failed to create user' })
          setIsLoading(false)
          return
        }
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      setErrors({ submit: error.message || 'An error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Slide-out Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-lg z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {editingUser ? 'Update team member details' : 'Add a team member and assign their role'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Email Field */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-900 block mb-2">
              Email address {!editingUser && '*'}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="name@lab.local"
              disabled={editingUser ? true : false}
              className={`w-full ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-xs text-red-600 mt-2">{errors.email}</p>}
            {!editingUser && (
              <p className="text-xs text-gray-600 mt-2">Must be unique, used for login</p>
            )}
          </div>

          {/* Name Field */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-900 block mb-2">
              Full name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Ravi Kumar"
              className={`w-full ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-2">{errors.name}</p>}
          </div>

          {/* Role Field */}
          <div>
            <Label htmlFor="role" className="text-sm font-medium text-gray-900 block mb-2">
              Role *
            </Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Select role --</option>
              <option value="admin">Admin - Full access, manage users & master data</option>
              <option value="analyst">Analyst - Perform tests, enter results</option>
              <option value="reviewer">Reviewer - Review and approve test results</option>
            </select>
            {errors.role && <p className="text-xs text-red-600 mt-2">{errors.role}</p>}
            <p className="text-xs text-gray-600 mt-2">Role determines what this user can do</p>
          </div>

          {/* Password Field */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-900 block mb-2">
              Password {!editingUser && '*'}
            </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Min 8 characters"
                className={`w-full ${errors.password ? 'border-red-500' : ''}`}
              />
              {errors.password && <p className="text-xs text-red-600 mt-2">{errors.password}</p>}

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength === 'weak'
                            ? 'w-1/3 bg-red-500'
                            : passwordStrength === 'medium'
                              ? 'w-2/3 bg-yellow-500'
                              : 'w-full bg-green-500'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium">
                      {passwordStrength === 'weak' && <span className="text-red-600">Weak</span>}
                      {passwordStrength === 'medium' && (
                        <span className="text-yellow-600">Medium</span>
                      )}
                      {passwordStrength === 'strong' && <span className="text-green-600">Strong</span>}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Use 8+ characters, mix uppercase, numbers for stronger password
                  </p>
                </div>
              )}

              {!formData.password && (
                <p className="text-xs text-gray-600 mt-2">
                  {editingUser
                    ? 'Leave blank to keep existing password'
                    : 'Minimum 8 characters. User can change after first login.'}
                </p>
              )}
            </div>

          {/* Active Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Active user (can log in)</span>
            </label>
          </div>
        </form>

        {/* Footer / Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </>
  )
}
