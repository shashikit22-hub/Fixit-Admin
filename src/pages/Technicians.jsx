import { useState, useEffect } from 'react'
import { MdAdd, MdEdit, MdDelete, MdClose } from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'

const specialties = ['Electrician', 'Plumber', 'Carpenter', 'Painter', 'Cleaner', 'Appliance Technician', 'General']

export default function Technicians() {
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', specialty: '', isAvailable: true })

  const fetchTechnicians = () => {
    setLoading(true)
    api.get('/technicians')
      .then(res => setTechnicians(res.data))
      .catch(() => toast.error('Failed to load technicians'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTechnicians() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', phone: '', specialty: '', isAvailable: true })
    setShowModal(true)
  }

  const openEdit = (tech) => {
    setEditing(tech)
    setForm({ name: tech.name, phone: tech.phone, specialty: tech.specialty, isAvailable: tech.isAvailable })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/technicians/${editing.id}`, form)
        toast.success('Technician updated')
      } else {
        await api.post('/technicians', form)
        toast.success('Technician added')
      }
      setShowModal(false)
      fetchTechnicians()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this technician?')) return
    try {
      await api.delete(`/technicians/${id}`)
      toast.success('Technician deleted')
      fetchTechnicians()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Technicians</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors text-sm"
        >
          <MdAdd size={18} /> Add Technician
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Specialty</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {technicians.map(tech => (
                  <tr key={tech.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{tech.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{tech.phone}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{tech.specialty}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tech.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tech.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(tech)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                          <MdEdit size={18} />
                        </button>
                        <button onClick={() => handleDelete(tech.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {technicians.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No technicians yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Technician' : 'Add Technician'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <MdClose size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <select
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  <option value="">Select specialty...</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="available" className="text-sm text-gray-700">Available</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-cyan-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">
                  {editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
