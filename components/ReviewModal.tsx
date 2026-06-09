'use client'

import { useState } from 'react'
import { approveReview, rejectReview } from '@/lib/actions/reviewer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Test {
  id: number
  testId: number
  test: { name: string; unit: string }
  resultValue: string | null
  resultUnit: string | null
  assignedToUser: { name: string } | null
}

interface Sample {
  id: number
  sampleCode: string
  client: string
  category: { name: string; color: string }
  sampleTests: Test[]
}

interface ReviewModalProps {
  sample: Sample
  onClose: () => void
  onReload: () => void
}

export function ReviewModal({ sample, onClose, onReload }: ReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [comment, setComment] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [selectedTests, setSelectedTests] = useState<number[]>([])
  const [error, setError] = useState('')

  const handleApprove = async (approvalType: 'ready_to_issue' | 'issued') => {
    setIsSubmitting(true)
    setError('')
    try {
      const result = await approveReview(sample.id, comment, approvalType)
      if (result.success) {
        await onReload()
        onClose()
      } else {
        setError(result.error || 'Failed to approve')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for revision')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const result = await rejectReview(sample.id, rejectReason, selectedTests)
      if (result.success) {
        await onReload()
        onClose()
      } else {
        setError(result.error || 'Failed to reject')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{sample.sampleCode}</h2>
              <p className="text-sm text-gray-600 mt-1">{sample.client}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Category Badge */}
          <div>
            <span
              className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: sample.category.color }}
            >
              {sample.category.name}
            </span>
          </div>

          {/* Tests Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Test</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Result</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Analyst</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sample.sampleTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{test.test.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {test.resultValue} {test.resultUnit || test.test.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {test.assignedToUser?.name || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comment Section (Approve) */}
          {!showRejectForm && (
            <div>
              <Label htmlFor="comment" className="text-sm font-medium">
                Review Comment (Optional)
              </Label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any notes about this review..."
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
              />
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-semibold text-gray-900">Select Tests to Redo</h3>
              <div className="space-y-2">
                {sample.sampleTests.map((test) => (
                  <label key={test.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(test.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTests([...selectedTests, test.id])
                        } else {
                          setSelectedTests(selectedTests.filter((id) => id !== test.id))
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{test.test.name}</span>
                  </label>
                ))}
              </div>

              <div>
                <Label htmlFor="rejectReason" className="text-sm font-medium">
                  Reason for Revision *
                </Label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain what needs to be corrected..."
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-6 flex items-center justify-end gap-3">
          {!showRejectForm ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting}
              >
                Request Revision
              </Button>
              <Button
                onClick={() => handleApprove('ready_to_issue')}
                disabled={isSubmitting}
                className="border border-green-600 text-green-700 hover:bg-green-50 bg-white"
              >
                {isSubmitting ? 'Approving...' : '✓ Approved & Ready for Issuing'}
              </Button>
              <Button
                onClick={() => handleApprove('issued')}
                disabled={isSubmitting}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                {isSubmitting ? 'Approving...' : '📋 Approved & Issued'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(false)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Back to Analyst'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
