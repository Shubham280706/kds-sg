export function TestProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{completed}/{total} tests</span>
        <span className="text-gray-500">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
