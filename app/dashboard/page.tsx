import { MainLayout } from '@/components/MainLayout'

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">KDS Lab Sample Tracking System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Samples</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-2">0</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Welcome to KDS Lab</h2>
          <p className="text-gray-600">
            This is the Lab Sample Tracking and KDS Dashboard system. Use the admin section to
            configure categories and tests, then register samples for analysis.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
