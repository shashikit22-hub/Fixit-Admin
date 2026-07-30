import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MdPhone, MdEmail, MdLocationOn, MdBadge, MdWork,
  MdCheckCircle, MdTrendingUp, MdStar, MdCreditCard,
  MdEdit, MdDelete, MdChevronLeft, MdChevronRight,
} from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Stars from '../components/ui/Stars'
import DataTable from '../components/ui/DataTable'
import { Skeleton } from '../components/ui/Skeleton'
import { statusColors, statusDotColors, specialtyColors, specialties, assignmentStatusColors, assignmentStatusDotColors } from '../constants/status'

const IST = { timeZone: 'Asia/Kolkata' }
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', IST)
const fmtDateTime = (d) => {
  const date = new Date(d)
  return `${date.toLocaleDateString('en-IN', IST)}, ${date.toLocaleTimeString('en-IN', { ...IST, hour: '2-digit', minute: '2-digit', hour12: true })}`
}

const emptyForm = { name: '', phone: '', specialty: '', email: '', address: '', govtIdNumber: '', licenseNumber: '', isAvailable: true }

export default function TechnicianDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tech, setTech] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nextDisabled, setNextDisabled] = useState(false)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editErrors, setEditErrors] = useState({})
  const [editTouched, setEditTouched] = useState({})
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchData = () => {
    setLoading(true)
    setNextDisabled(false)
    api.get(`/technicians/${id}/details`)
      .then(res => setTech(res.data))
      .catch(() => toast.error('Failed to load technician'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [id])

  const toggleAvailability = async () => {
    try {
      await api.put(`/technicians/${id}`, { isAvailable: !tech.isAvailable })
      setTech(prev => ({ ...prev, isAvailable: !prev.isAvailable }))
      toast.success(`Marked ${!tech.isAvailable ? 'available' : 'unavailable'}`)
    } catch {
      toast.error('Failed to update')
    }
  }

  // Prev/Next navigation
  const handlePrev = () => {
    const prevId = parseInt(id) - 1
    if (prevId >= 1) navigate(`/technicians/${prevId}`)
  }

  const handleNext = () => {
    const nextId = parseInt(id) + 1
    api.get(`/technicians/${nextId}/details`)
      .then(() => navigate(`/technicians/${nextId}`))
      .catch(() => {
        setNextDisabled(true)
        toast.error('No next technician')
      })
  }

  // Edit handlers
  const openEdit = () => {
    setEditForm({
      name: tech.name,
      phone: tech.phone,
      specialty: tech.specialty || '',
      email: tech.email || '',
      address: tech.address || '',
      govtIdNumber: tech.govtIdNumber || '',
      licenseNumber: tech.licenseNumber || '',
      isAvailable: tech.isAvailable,
    })
    setEditErrors({})
    setEditTouched({})
    setShowEditModal(true)
  }

  const validateEditField = (field, value) => {
    if (field === 'name' && !value.trim()) return 'Name is required'
    if (field === 'phone') {
      if (!value.trim()) return 'Phone is required'
      if (!/^[0-9+\-\s()]+$/.test(value)) return 'Invalid phone format'
    }
    if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format'
    if (field === 'specialty' && !value) return 'Specialty is required'
    return ''
  }

  const handleEditBlur = (field) => {
    setEditTouched(prev => ({ ...prev, [field]: true }))
    const err = validateEditField(field, editForm[field])
    setEditErrors(prev => ({ ...prev, [field]: err }))
  }

  const validateEdit = () => {
    const errs = {}
    const nameErr = validateEditField('name', editForm.name)
    const phoneErr = validateEditField('phone', editForm.phone)
    const emailErr = validateEditField('email', editForm.email)
    const specialtyErr = validateEditField('specialty', editForm.specialty)
    if (nameErr) errs.name = nameErr
    if (phoneErr) errs.phone = phoneErr
    if (emailErr) errs.email = emailErr
    if (specialtyErr) errs.specialty = specialtyErr
    setEditErrors(errs)
    setEditTouched({ name: true, phone: true, email: true, specialty: true })
    return Object.keys(errs).length === 0
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!validateEdit()) return
    setEditSubmitting(true)
    const payload = {
      ...editForm,
      email: editForm.email.trim() || null,
      address: editForm.address.trim() || null,
      govtIdNumber: editForm.govtIdNumber.trim() || null,
      licenseNumber: editForm.licenseNumber.trim() || null,
    }
    try {
      await api.put(`/technicians/${id}`, payload)
      toast.success('Technician updated')
      setShowEditModal(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Delete handler
  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await api.delete(`/technicians/${id}`)
      toast.success('Technician deleted')
      navigate('/technicians')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fadeIn space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!tech) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 text-lg mb-4">Technician not found</p>
        <Button onClick={() => navigate('/technicians')} variant="outline">Back to Technicians</Button>
      </div>
    )
  }

  const assignmentColumns = [
    {
      accessorKey: 'requestCode',
      header: 'Request',
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/requests/${row.original.serviceRequestId}`) }}
          className="font-mono text-xs text-atoll-600 hover:text-atoll-700 hover:underline"
        >
          #{row.original.requestCode || row.original.serviceRequestId}
        </button>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ getValue }) => <span className="text-gray-700">{getValue()}</span>,
    },
    {
      accessorKey: 'serviceType',
      header: 'Service Type',
      cell: ({ getValue }) => <span className="text-gray-600">{getValue()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue()
        return (
          <Badge className={statusColors[s] || 'bg-gray-100 text-gray-700'} dot={statusDotColors[s]}>
            {s === 'InProgress' ? 'In Progress' : s}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'assignmentStatus',
      header: 'Response',
      cell: ({ getValue }) => {
        const s = getValue()
        return s ? (
          <Badge className={assignmentStatusColors[s] || 'bg-gray-100 text-gray-700'} dot={assignmentStatusDotColors[s]}>
            {s}
          </Badge>
        ) : <span className="text-gray-300 text-xs">-</span>
      },
    },
    {
      accessorKey: 'assignedAt',
      header: 'Assigned',
      cell: ({ getValue }) => <span className="text-gray-500 text-xs">{fmtDate(getValue())}</span>,
    },
    {
      accessorKey: 'completedAt',
      header: 'Completed',
      cell: ({ getValue }) => getValue()
        ? <span className="text-green-600 text-xs">{fmtDate(getValue())}</span>
        : <span className="text-gray-300 text-xs">-</span>,
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ getValue }) => getValue()
        ? <Stars rating={getValue()} size={14} />
        : <span className="text-gray-300 text-xs">-</span>,
    },
  ]

  return (
    <div className="animate-fadeIn">
      {/* PageHeader with Breadcrumbs */}
      <PageHeader
        title={tech.name}
        subtitle={`${tech.specialty || 'General'} · Joined ${fmtDate(tech.joinedAt)}`}
        breadcrumbs={[
          { label: 'Technicians', to: '/technicians' },
          { label: tech.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* Prev/Next nav */}
            <div className="flex items-center gap-1 mr-1 print:hidden">
              <button
                onClick={handlePrev}
                disabled={parseInt(id) <= 1}
                className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous technician"
              >
                <MdChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                disabled={nextDisabled}
                className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next technician"
              >
                <MdChevronRight size={18} />
              </button>
            </div>

            {/* Availability toggle */}
            <button
              onClick={toggleAvailability}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-ring print:hidden ${
                tech.isAvailable
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {tech.isAvailable ? 'Available' : 'Unavailable'}
            </button>

            {/* Edit */}
            <Button onClick={openEdit} variant="outline" size="sm" className="print:hidden">
              <MdEdit size={14} /> Edit
            </Button>

            {/* Delete */}
            <Button onClick={() => setShowDeleteDialog(true)} variant="danger" size="sm" className="print:hidden">
              <MdDelete size={14} /> Delete
            </Button>

          </div>
        }
      />

      {/* === TWO COLUMN LAYOUT === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left Column (2/3): Profile + Assignment History ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Profile Card */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Section title="Profile">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                <Field label="Phone" value={
                  <span className="flex items-center gap-1.5">
                    <MdPhone size={14} className="text-gray-400" /> {tech.phone}
                  </span>
                } />
                <Field label="Email" value={
                  tech.email ? (
                    <span className="flex items-center gap-1.5">
                      <MdEmail size={14} className="text-gray-400" /> {tech.email}
                    </span>
                  ) : <span className="text-gray-300">Not provided</span>
                } />
                <Field label="Specialty" value={
                  tech.specialty ? (
                    <Badge className={specialtyColors[tech.specialty] || 'bg-gray-100 text-gray-700'}>
                      {tech.specialty}
                    </Badge>
                  ) : <span className="text-gray-300">Not set</span>
                } />
                <Field label="Address" value={
                  tech.address ? (
                    <span className="flex items-center gap-1.5">
                      <MdLocationOn size={14} className="text-gray-400" /> {tech.address}
                    </span>
                  ) : <span className="text-gray-300">Not provided</span>
                } />
                <Field label="Govt ID" value={
                  tech.govtIdNumber ? (
                    <span className="flex items-center gap-1.5">
                      <MdCreditCard size={14} className="text-gray-400" /> {tech.govtIdNumber}
                    </span>
                  ) : <span className="text-gray-300">Not provided</span>
                } />
                <Field label="License Number" value={
                  tech.licenseNumber ? (
                    <span className="flex items-center gap-1.5">
                      <MdBadge size={14} className="text-gray-400" /> {tech.licenseNumber}
                    </span>
                  ) : <span className="text-gray-300">Not provided</span>
                } />
                <Field label="Joined" value={fmtDate(tech.joinedAt)} muted />
              </div>
            </Section>
          </div>

          {/* Assignment History Card */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Section title="Assignment History" count={tech.assignments?.length} last>
              {tech.assignments?.length > 0 ? (
                <div className="-mx-6 -mb-4">
                  <DataTable
                    columns={assignmentColumns}
                    data={tech.assignments}
                    pageSize={10}
                    onRowClick={(assignment) => navigate(`/requests/${assignment.serviceRequestId}`)}
                  />
                </div>
              ) : (
                <div className="text-center py-6">
                  <MdWork size={28} className="text-gray-300 mx-auto mb-1" />
                  <p className="text-sm text-gray-400">No assignments yet</p>
                </div>
              )}
            </Section>
          </div>
        </div>

        {/* ── Right Column (1/3): Performance + Availability ── */}
        <div className="space-y-4">

          {/* Performance Card */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Section title="Performance" last>
              <div className="space-y-3">
                <StatCard
                  icon={MdWork}
                  color="text-blue-600 bg-blue-50"
                  value={tech.totalJobs}
                  label="Total Jobs"
                />
                <StatCard
                  icon={MdCheckCircle}
                  color="text-green-600 bg-green-50"
                  value={tech.completedJobs}
                  label="Completed"
                />
                <StatCard
                  icon={MdTrendingUp}
                  color="text-purple-600 bg-purple-50"
                  value={`${tech.completionRate}%`}
                  label="Completion Rate"
                />
                <StatCard
                  icon={MdStar}
                  color="text-yellow-600 bg-yellow-50"
                  value={tech.averageRating != null ? (
                    <span className="flex items-center gap-1">
                      {tech.averageRating}
                      <MdStar size={16} className="text-yellow-400" />
                    </span>
                  ) : 'No ratings'}
                  label="Avg Rating"
                />
              </div>
            </Section>
          </div>

          {/* Availability Card */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Section title="Availability" last>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Current Status</p>
                  <p className={`text-xs font-semibold mt-1 ${tech.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {tech.isAvailable ? 'Available' : 'Unavailable'}
                  </p>
                </div>
                <button
                  onClick={toggleAvailability}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors focus-ring print:hidden ${
                    tech.isAvailable
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  Mark {tech.isAvailable ? 'Unavailable' : 'Available'}
                </button>
              </div>
              {tech.activeJobs > 0 && (
                <p className="text-xs text-gray-400 mt-3">Currently has {tech.activeJobs} active job{tech.activeJobs > 1 ? 's' : ''}</p>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Technician"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="max-h-[75vh] overflow-y-auto">
          {/* Section: Personal Information */}
          <div className="px-6 py-2.5 bg-gray-50/80 border-b border-gray-100">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Personal Information</h4>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Name *"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                onBlur={() => handleEditBlur('name')}
                placeholder="Full name"
                error={editTouched.name ? editErrors.name : ''}
                autoFocus
              />
              <Input
                label="Phone *"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                onBlur={() => handleEditBlur('phone')}
                placeholder="e.g. +91 98765 43210"
                error={editTouched.phone ? editErrors.phone : ''}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                onBlur={() => handleEditBlur('email')}
                placeholder="email@example.com"
                error={editTouched.email ? editErrors.email : ''}
                helperText={!editErrors.email && !editTouched.email ? 'Optional' : ''}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
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
                  value={editForm.specialty}
                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                  onBlur={() => handleEditBlur('specialty')}
                  error={editTouched.specialty ? editErrors.specialty : ''}
                >
                  <option value="">Select specialty...</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                {editForm.specialty && (
                  <div className="mt-2">
                    <Badge className={specialtyColors[editForm.specialty] || 'bg-gray-100 text-gray-700'}>
                      {editForm.specialty}
                    </Badge>
                  </div>
                )}
              </div>
              <Input
                label="License Number"
                value={editForm.licenseNumber}
                onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                placeholder="e.g. LIC-12345"
                helperText="Optional"
              />
            </div>
            <Input
              label="Govt ID Number"
              value={editForm.govtIdNumber}
              onChange={(e) => setEditForm({ ...editForm, govtIdNumber: e.target.value })}
              placeholder="e.g. Aadhaar / PAN"
              helperText="Optional"
            />

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Available for assignments</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editForm.isAvailable ? 'This technician can receive new jobs' : 'This technician will not receive new jobs'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={editForm.isAvailable}
                onClick={() => setEditForm({ ...editForm, isAvailable: !editForm.isAvailable })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                  editForm.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  editForm.isAvailable ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={editSubmitting}>
              Update Technician
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Technician"
        message={`Are you sure you want to delete ${tech.name}? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  )
}

function Section({ title, count, last, children }) {
  return (
    <div className={last ? '' : 'border-b border-gray-200'}>
      <div className="px-6 py-3 bg-gray-50/70 flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
        {count != null && count > 0 && <span className="text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-full">{count}</span>}
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  )
}

function Field({ label, value, muted }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className={`text-sm ${muted ? 'text-gray-500' : 'text-gray-800'}`}>{value}</p>
    </div>
  )
}

function StatCard({ icon: Icon, color, value, label }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
      <div className={`inline-flex p-2 rounded-lg ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
      </div>
    </div>
  )
}
