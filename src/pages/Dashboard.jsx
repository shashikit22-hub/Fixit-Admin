import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MdFiberNew, MdAssignment, MdLoop, MdCheckCircle, MdCancel, MdPeople } from 'react-icons/md'
import api from '../services/api'

const statusColors = {
  New: 'bg-blue-100 text-blue-700',
  Assigned: 'bg-yellow-100 text-yellow-700',
  InProgress: 'bg-purple-100 text-purple-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
  if (!data) return <div className="text-center py-12 text-red-500">Failed to load dashboard</div>

  const cards = [
    { label: 'New', count: data.newCount, icon: MdFiberNew, color: 'bg-blue-500' },
    { label: 'Assigned', count: data.assignedCount, icon: MdAssignment, color: 'bg-yellow-500' },
    { label: 'In Progress', count: data.inProgressCount, icon: MdLoop, color: 'bg-purple-500' },
    { label: 'Completed', count: data.completedCount, icon: MdCheckCircle, color: 'bg-green-500' },
    { label: 'Cancelled', count: data.cancelledCount, icon: MdCancel, color: 'bg-red-500' },
    { label: 'Technicians', count: `${data.availableTechnicians}/${data.totalTechnicians}`, icon: MdPeople, color: 'bg-cyan-500' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
              <Icon className="text-white" size={22} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
          <Link to="/requests" className="text-cyan-600 text-sm hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm">
                    <Link to={`/requests/${req.id}`} className="text-cyan-600 font-medium hover:underline">#{req.id}</Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-900">{req.customerName}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{req.serviceType}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100 text-gray-700'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.recentRequests.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No requests yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
