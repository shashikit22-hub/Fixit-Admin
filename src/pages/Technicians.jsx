import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MdAdd, MdEdit, MdDelete, MdSearch, MdPeople, MdVisibility, MdClear } from 'react-icons/md'
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
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const hasFilters = specialtyFilter || availabilityFilter || search
  const clearFilters = () => {
    setSearch('')
    setSpecialtyFilter('')
    setAvailabilityFilter('')
  }

  const fetchTechnicians = () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (specialtyFilter) params.specialty = specialtyFilter
    if (availabilityFilter) params.isAvailable = availabilityFilter === 'available'
    api.get('/technicians', { params })
      .then(res => {
        setTechnicians(res.data.data)
      })
      .catch(() => toast.error('Failed to load technicians'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTechnicians() }, [search, specialtyFilter, availabilityFilter])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setTouched({})
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
    setTouched({})
    setShowModal(true)
  }

  const validateField = (field, value) => {
    if (field === 'name' && !value.trim()) return 'Name is required'
    if (field === 'phone') {
      if (!value.trim()) return 'Phone is required'
      if (!/^[0-9+\-\s()]+$/.test(value)) return 'Invalid phone format'
    }
    if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format'
    if (field === 'specialty' && !value) return 'Specialty is required'
    return ''
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const err = validateField(field, form[field])
    setErrors(prev => ({ ...prev, [field]: err }))
  }

  const validate = () => {
    const errs = {}
    const nameErr = validateField('name', form.name)
    const phoneErr = validateField('phone', form.phone)
    const emailErr = validateField('email', form.email)
    const specialtyErr = validateField('specialty', form.specialty)
    if (nameErr) errs.name = nameErr
    if (phoneErr) errs.phone = phoneErr
    if (emailErr) errs.email = emailErr
    if (specialtyErr) errs.specialty = specialtyErr
    setErrors(errs)
    setTouched({ name: true, phone: true, email: true, specialty: true })
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    const payload = {
      ...form,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      govtIdNumber: form.govtIdNumber.trim() || null,
      licenseNumber: form.licenseNumber.trim() || null,
    }
    try {
      if (editing) {
        await api.put(`/technicians/${editing.id}`, payload)
        toast.success('Technician updated')
      } else {
        await api.post('/technicians', payload)
        toast.success('Technician added')
      }
      setShowModal(false)
      fetchTechnicians()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSubmitting(false)
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
        <div className="flex items-center gap-1.5">
          <Link
            to={`/technicians/${row.original.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-atoll-600 hover:bg-atoll-50 border border-atoll-200 transition-colors"
          >
            <MdVisibility size={14} /> View
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row.original) }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-atoll-600 hover:bg-atoll-50 border border-gray-200 hover:border-atoll-200 transition-colors"
            aria-label={`Edit ${row.original.name}`}
          >
            <MdEdit size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.original) }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors"
            aria-label={`Delete ${row.original.name}`}
          >
            <MdDelete size={14} />
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

      {/* Filter Dropdowns + Search */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <Select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            aria-label="Filter by specialty"
          >
            <option value="">All Specialties</option>
            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        <div>
          <Select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            aria-label="Filter by availability"
          >
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </Select>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            title="Clear all filters"
          >
            <MdClear size={16} /> Clear
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email..."
              className="w-72 pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm outline-none focus-ring hover:border-gray-300 focus:border-atoll-500 transition-all"
              aria-label="Search technicians"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                aria-label="Clear search"
              >
                <MdClear size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={technicians}
          loading={loading}
          pageSize={20}
          emptyTitle="No technicians found"
          emptyDescription={hasFilters ? 'Try adjusting your search or filters' : 'Add your first technician to get started'}
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
        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto">
          {/* Section: Personal Information */}
          <div className="px-6 py-2.5 bg-gray-50/80 border-b border-gray-100">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Personal Information</h4>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={() => handleBlur('name')}
                placeholder="Full name"
                error={touched.name ? errors.name : ''}
                autoFocus
              />
              <Input
                label="Phone *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onBlur={() => handleBlur('phone')}
                placeholder="e.g. +91 98765 43210"
                error={touched.phone ? errors.phone : ''}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={() => handleBlur('email')}
                placeholder="email@example.com"
                error={touched.email ? errors.email : ''}
                helperText={!errors.email && !touched.email ? 'Optional' : ''}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address"
                  rows={1}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm focus-ring hover:border-atoll-300 focus:border-atoll-500 resize-none"
                />
                <p className="mt-1.5 text-xs text-gray-400">Optional</p>
              </div>
            </div>
          </div>

          {/* Section: Professional Details */}
          <div className="px-6 py-2.5 bg-gray-50/80 border-b border-gray-100 border-t">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Professional Details</h4>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Specialty *"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  onBlur={() => handleBlur('specialty')}
                  error={touched.specialty ? errors.specialty : ''}
                >
                  <option value="">Select specialty...</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                {form.specialty && (
                  <div className="mt-2">
                    <Badge className={specialtyColors[form.specialty] || 'bg-gray-100 text-gray-700'}>
                      {form.specialty}
                    </Badge>
                  </div>
                )}
              </div>
              <Input
                label="License Number"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                placeholder="e.g. LIC-12345"
                helperText="Optional"
              />
            </div>
            <Input
              label="Govt ID Number"
              value={form.govtIdNumber}
              onChange={(e) => setForm({ ...form, govtIdNumber: e.target.value })}
              placeholder="e.g. Aadhaar / PAN"
              helperText="Optional"
            />

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Available for assignments</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {form.isAvailable ? 'This technician can receive new jobs' : 'This technician will not receive new jobs'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isAvailable}
                onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                  form.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  form.isAvailable ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              {editing ? 'Update Technician' : 'Add Technician'}
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
