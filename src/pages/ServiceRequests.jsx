import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MdSearch, MdDownload, MdFilterList } from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'

const statusColors = {
  New: 'bg-blue-100 text-blue-700',
  Assigned: 'bg-yellow-100 text-yellow-700',
  InProgress: 'bg-purple-100 text-purple-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
}

const statuses = ['', 'New', 'Assigned', 'InProgress', 'Completed', 'Cancelled']
const serviceTypes = ['', 'Electrical', 'Plumbing', 'Carpentry', 'Painting', 'Cleaning', 'Appliance Repair', 'Other']

export default function ServiceRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const fetchRequests = () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    if (typeFilter) params.serviceType = typeFilter

    api.get('/servicerequests', { params })
      .then(res => setRequests(res.data))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRequests() }, [statusFilter, typeFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchRequests()
  }

  const handleExport = async () => {
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.serviceType = typeFilter

      const res = await api.get('/servicerequests/export', { params, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `ServiceRequests_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Excel exported')
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Service Requests</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          <MdDownload size={18} /> Export Excel
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <button type="submit" className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 text-sm">
              Search
            </button>
          </form>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Status</option>
              {statuses.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">All Types</option>
              {serviceTypes.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Technician</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm">
                      <Link to={`/requests/${req.id}`} className="text-cyan-600 font-medium hover:underline">#{req.id}</Link>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-900">{req.customerName}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{req.customerPhone}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{req.serviceType}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100 text-gray-700'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {req.assignments?.length > 0 ? req.assignments.map(a => a.technicianName).join(', ') : '-'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No requests found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
