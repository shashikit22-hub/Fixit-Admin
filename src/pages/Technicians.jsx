import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdAdd, MdEdit, MdDelete, MdSearch, MdPeople } from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'
import PageHeader from '../components/layout/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import DataTable from '../components/ui/DataTable'
import EmptyState from '../components/ui/EmptyState'
import { specialties, specialtyColors } from '../constants/status'

const emptyForm = { name: '', phone: '', specialty: '', email: '', address: '', govtIdNumber: '', licenseNumber: '', isAvailable: true }

export default function Technicians() {
  const navigate = useNavigate()
  const [technicians, setTechnicians] = useState([])
  const [stats, setStats] = useState({ total: 0, available: 0, unavailable: 0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [search, setSearch] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTechnicians = () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (specialtyFilter) params.specialty = specialtyFilter
    api.get('/technicians', { params })
      .then(res => {
        setTechnicians(res.data.data)
        setStats(res.data.stats)
      })
      .catch(() => toast.error('Failed to load technicians'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTechnicians() }, [search, specialtyFilter])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (tech) => {
    setEditing(tech)
    setForm({
      name: tech.name,
      phone: tech.phone,
      specialty: tech.specialty,
      email: tech.email || '',
      address: tech.address || '',
      govtIdNumber: tech.govtIdNumber || '',
      licenseNumber: tech.licenseNumber || '',
      isAvailable: tech.isAvailable,
    })
    setErrors({})
    setShowModal(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.phone.trim()) errs.phone = 'Phone is required'
    else if (!/^[0-9+\-\s()]+$/.test(form.phone)) errs.phone = 'Invalid phone format'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
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

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/technicians/${deleteTarget.id}`)
      toast.success('Technician deleted')
      setDeleteTarget(null)
      fetchTechnicians()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const toggleAvailability = async (tech) => {
    try {
      await api.put(`/technicians/${tech.id}`, { isAvailable: !tech.isAvailable })
      setTechnicians(prev => prev.map(t => t.id === tech.id ? { ...t, isAvailable: !t.isAvailable } : t))
      toast.success(`${tech.name} marked ${!tech.isAvailable ? 'available' : 'unavailable'}`)
    } catch {
      toast.error('Failed to update')
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue()}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ getValue }) => <span className="text-gray-600">{getValue()}</span>,
    },
    {
      accessorKey: 'specialty',
      header: 'Specialty',
      cell: ({ row }) => (
        <Badge className={specialtyColors[row.original.specialty] || 'bg-gray-100 text-gray-700'}>
          {row.original.specialty || 'N/A'}
        </Badge>
      ),
    },
    {
      accessorKey: 'activeJobs',
      header: 'Active Jobs',
      cell: ({ getValue }) => getValue()
        ? <Badge className="bg-blue-100 text-blue-700">{getValue()}</Badge>
        : <span className="text-gray-300">0</span>,
    },
    {
      accessorKey: 'isAvailable',
      header: 'Status',
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleAvailability(row.original) }}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors focus-ring ${
            row.original.isAvailable
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
          aria-label={`Toggle availability for ${row.original.name}`}
        >
          {row.original.isAvailable ? 'Available' : 'Unavailable'}
        </button>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row.original) }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 focus-ring"
            aria-label={`Edit ${row.original.name}`}
          >
            <MdEdit size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.original) }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 focus-ring"
            aria-label={`Delete ${row.original.name}`}
          >
            <MdDelete size={18} />
          </button>
        </div>
      ),
    },
  ], [])

  return (
    <div>
      <PageHeader
        title="Technicians"
        actions={
          <Button onClick={openAdd}>
            <MdAdd size={18} /> Add Technician
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-atoll-500 w-10 h-10 rounded-lg flex items-center justify-center">
            <MdPeople className="text-white" size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-green-500 w-10 h-10 rounded-lg flex items-center justify-center">
            <MdPeople className="text-white" size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
            <p className="text-sm text-gray-500">Available</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-red-500 w-10 h-10 rounded-lg flex items-center justify-center">
            <MdPeople className="text-white" size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.unavailable}</p>
            <p className="text-sm text-gray-500">Unavailable</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none text-sm focus-ring"
              aria-label="Search technicians"
            />
          </div>
          <Select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="w-auto"
            aria-label="Filter by specialty"
          >
            <option value="">All Specialties</option>
            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={technicians}
          loading={loading}
          pageSize={20}
          emptyTitle="No technicians found"
          emptyDescription={search || specialtyFilter ? 'Try adjusting your search or filter' : 'Add your first technician to get started'}
          emptyIcon={MdPeople}
          onRowClick={(tech) => navigate(`/technicians/${tech.id}`)}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Technician' : 'Add Technician'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
            error={errors.name}
            autoFocus
          />
          <Input
            label="Phone"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone number"
            error={errors.phone}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email address (optional)"
            error={errors.email}
          />
          <Select
            label="Specialty"
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          >
            <option value="">Select specialty...</option>
            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Address (optional)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm focus-ring hover:border-atoll-300 focus:border-atoll-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Govt ID Number"
              value={form.govtIdNumber}
              onChange={(e) => setForm({ ...form, govtIdNumber: e.target.value })}
              placeholder="Optional"
            />
            <Input
              label="License Number"
              value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="available"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-atoll-600 focus:ring-atoll-500"
            />
            <label htmlFor="available" className="text-sm text-gray-700">Available</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editing ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Technician"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  )
}
