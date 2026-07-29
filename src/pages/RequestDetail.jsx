import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MdArrowBack } from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'

const statusColors = {
  New: 'bg-blue-100 text-blue-700',
  Assigned: 'bg-yellow-100 text-yellow-700',
  InProgress: 'bg-purple-100 text-purple-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
}

const statuses = ['New', 'Assigned', 'InProgress', 'Completed', 'Cancelled']

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [selectedTech, setSelectedTech] = useState('')
  const [assignNote, setAssignNote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/servicerequests/${id}`),
      api.get('/technicians'),
    ]).then(([reqRes, techRes]) => {
      setRequest(reqRes.data)
      setTechnicians(techRes.data)
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (newStatus) => {
    try {
      const { data } = await api.put(`/servicerequests/${id}/status`, { status: newStatus })
      setRequest(prev => ({ ...prev, ...data }))
      toast.success(`Status updated to ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!selectedTech) return toast.error('Select a technician')
    try {
      await api.post('/assignments', {
        serviceRequestId: parseInt(id),
        technicianId: parseInt(selectedTech),
        notes: assignNote || null,
      })
      // Reload request to show updated assignments
      const { data } = await api.get(`/servicerequests/${id}`)
      setRequest(data)
      setSelectedTech('')
      setAssignNote('')
      toast.success('Technician assigned')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign')
    }
  }

  const handleComplete = async (assignmentId) => {
    try {
      await api.put(`/assignments/${assignmentId}/complete`)
      const { data } = await api.get(`/servicerequests/${id}`)
      setRequest(data)
      toast.success('Assignment marked completed')
    } catch {
      toast.error('Failed to complete')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>
  if (!request) return <div className="text-center py-12 text-red-500">Request not found</div>

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <MdArrowBack size={20} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Info */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Request #{request.id}</h2>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[request.status] || 'bg-gray-100'}`}>
              {request.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Customer Name</p>
              <p className="font-medium text-gray-900">{request.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{request.customerPhone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Service Type</p>
              <p className="font-medium text-gray-900">{request.serviceType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium text-gray-900">{new Date(request.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {request.description && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{request.description}</p>
            </div>
          )}

          {/* Status Update */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={request.status === s}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    request.status === s
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-cyan-100 hover:text-cyan-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assign Technician + Current Assignments */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Technician</h3>
            <form onSubmit={handleAssign} className="space-y-3">
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
              >
                <option value="">Select technician...</option>
                {technicians.filter(t => t.isAvailable).map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>
                ))}
              </select>
              <textarea
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
              />
              <button type="submit" className="w-full bg-cyan-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">
                Assign
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignments</h3>
            {request.assignments?.length > 0 ? (
              <div className="space-y-3">
                {request.assignments.map(a => (
                  <div key={a.id} className="border border-gray-200 rounded-lg p-3">
                    <p className="font-medium text-gray-900 text-sm">{a.technicianName}</p>
                    <p className="text-xs text-gray-500">{a.technicianPhone}</p>
                    <p className="text-xs text-gray-400 mt-1">Assigned: {new Date(a.assignedAt).toLocaleString()}</p>
                    {a.notes && <p className="text-xs text-gray-500 mt-1">Note: {a.notes}</p>}
                    {a.completedAt ? (
                      <p className="text-xs text-green-600 mt-1 font-medium">Completed: {new Date(a.completedAt).toLocaleString()}</p>
                    ) : (
                      <button
                        onClick={() => handleComplete(a.id)}
                        className="mt-2 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No technicians assigned yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
