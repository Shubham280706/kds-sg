'use client'

interface KPICardProps {
  label: string
  value: number
  color?: 'default' | 'green' | 'blue' | 'red'
}

const colorStyles: Record<string, string> = {
  default: 'text-gray-900',
  green: 'text-green-600',
  blue: 'text-blue-600',
  red: 'text-red-600',
}

const bgStyles: Record<string, string> = {
  default: 'bg-white border-gray-200',
  green: 'bg-green-50 border-green-200',
  blue: 'bg-blue-50 border-blue-200',
  red: 'bg-red-50 border-red-200',
}

export function KPICard({ label, value, color = 'default' }: KPICardProps) {
  return (
    <div className={`rounded-lg p-4 border ${bgStyles[color]}`}>
      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-3xl font-bold mt-2 transition-all duration-300 ${colorStyles[color]}`}>
        {value}
      </p>
    </div>
  )
}
