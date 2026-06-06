import { Badge } from '@/components/ui/badge'

interface TATIndicatorProps {
  dueAt: Date
  createdAt: Date
  status: string
}

export function TATIndicator({ dueAt, createdAt, status }: TATIndicatorProps) {
  const now = new Date()
  const timeRemaining = dueAt.getTime() - now.getTime()
  const totalTime = dueAt.getTime() - createdAt.getTime()
  const percentUsed = 100 - (timeRemaining / totalTime) * 100

  let variant: 'success' | 'warning' | 'danger' = 'success'
  let label = ''

  if (timeRemaining < 0) {
    variant = 'danger'
    const hoursLate = Math.round(Math.abs(timeRemaining) / (1000 * 60 * 60))
    label = `${hoursLate}h overdue`
  } else if (percentUsed > 70) {
    variant = 'warning'
    const hoursLeft = Math.round(timeRemaining / (1000 * 60 * 60))
    label = `${hoursLeft}h left`
  } else {
    label = `On time`
  }

  return <Badge variant={variant}>{label}</Badge>
}
