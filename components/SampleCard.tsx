'use client'

import { TATIndicator } from '@/components/TATIndicator'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Test {
  id: number
  name: string
  status: string
  assignedToUser?: { name: string } | null
}

interface SampleCardProps {
  id: number
  code: string
  client: string
  categoryName: string
  categoryColor: string
  status: string
  tests: Test[]
  dueAt: Date
  createdAt: Date
}

const statusBorderColors: Record<string, string> = {
  registered: 'border-l-blue-500',
  assigned: 'border-l-blue-500',
  in_analysis: 'border-l-amber-500',
  under_review: 'border-l-purple-500',
  approved: 'border-l-green-500',
  reported: 'border-l-emerald-500',
  closed: 'border-l-gray-400',
}

const statusBgColors: Record<string, string> = {
  registered: 'bg-blue-50',
  assigned: 'bg-blue-50',
  in_analysis: 'bg-amber-50',
  under_review: 'bg-purple-50',
  approved: 'bg-green-50',
  reported: 'bg-emerald-50',
  closed: 'bg-gray-50',
}

export function SampleCard(props: SampleCardProps) {
  const completedTests = props.tests.filter((t) => t.status === 'done').length
  const totalTests = props.tests.length
  const completionPercent = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0

  // Determine color based on completion and TAT
  let accentColor = statusBorderColors[props.status] || 'border-l-gray-400'
  let bgColor = statusBgColors[props.status] || 'bg-gray-50'

  // If all tests done, use green
  if (completedTests === totalTests && totalTests > 0) {
    accentColor = 'border-l-green-500'
    bgColor = 'bg-green-50'
  }

  return (
    <Link href={`/samples/${props.id}`}>
      <div
        className={`p-5 border-l-4 border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-all ${accentColor} ${bgColor} h-full flex flex-col`}
      >
        {/* Header */}
        <div className="mb-4">
          <h2 className="font-bold text-lg text-gray-900 font-mono break-words mb-2">{props.code}</h2>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: props.categoryColor }}
              title={props.categoryName}
            />
            <p className="text-sm text-gray-700 font-medium">{props.categoryName}</p>
          </div>
        </div>

        {/* Tests List */}
        {totalTests > 0 && (
          <div className="mb-4 p-3 bg-white bg-opacity-50 rounded border border-gray-200 flex-1">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Tests ({completedTests}/{totalTests})
            </p>
            <div className="space-y-2">
              {props.tests.map((test, idx) => (
                <div key={test.id} className="flex items-start gap-2 text-xs">
                  <span className="flex-shrink-0 w-4 text-center">
                    {test.status === 'done' ? '✓' : '◯'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium ${
                        test.status === 'done'
                          ? 'text-gray-600 line-through'
                          : 'text-gray-900'
                      }`}
                    >
                      {idx + 1}. {test.name}
                    </p>
                    {test.assignedToUser && (
                      <p className="text-gray-600 text-xs mt-0.5">
                        {test.assignedToUser.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {totalTests > 0 && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  completionPercent === 100
                    ? 'bg-green-500'
                    : completionPercent >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                }`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {completionPercent}% complete
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
          <Badge variant="default" className="text-xs">
            {props.status.replace(/_/g, ' ')}
          </Badge>
          <TATIndicator dueAt={props.dueAt} createdAt={props.createdAt} />
        </div>
      </div>
    </Link>
  )
}
