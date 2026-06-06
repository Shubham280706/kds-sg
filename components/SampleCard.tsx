'use client'

import { TestProgressBar } from '@/components/TestProgressBar'
import { TATIndicator } from '@/components/TATIndicator'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface SampleCardProps {
  id: number
  code: string
  client: string
  categoryName: string
  categoryColor: string
  status: string
  completedTests: number
  totalTests: number
  assignedAnalyst?: string
  dueAt: Date
  createdAt: Date
}

const statusColors: Record<string, string> = {
  registered: 'bg-gray-50 border-gray-200',
  assigned: 'bg-blue-50 border-blue-200',
  in_analysis: 'bg-purple-50 border-purple-200',
  under_review: 'bg-yellow-50 border-yellow-200',
  approved: 'bg-green-50 border-green-200',
  reported: 'bg-emerald-50 border-emerald-200',
  closed: 'bg-gray-100 border-gray-300',
}

export function SampleCard(props: SampleCardProps) {
  return (
    <Link href={`/samples/${props.id}`}>
      <div
        className={`p-4 border rounded-lg cursor-pointer hover:shadow-lg transition-all ${
          statusColors[props.status] || 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{props.code}</h3>
            <p className="text-sm text-gray-600">{props.client}</p>
          </div>
          <div
            className="w-3 h-3 rounded-full mt-1"
            style={{ backgroundColor: props.categoryColor }}
            title={props.categoryName}
          />
        </div>

        <div className="space-y-2">
          <div>
            <TestProgressBar completed={props.completedTests} total={props.totalTests} />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="default">{props.status.replace(/_/g, ' ')}</Badge>
            <TATIndicator dueAt={props.dueAt} createdAt={props.createdAt} status={props.status} />
          </div>

          {props.assignedAnalyst && (
            <p className="text-xs text-gray-600">→ {props.assignedAnalyst}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
