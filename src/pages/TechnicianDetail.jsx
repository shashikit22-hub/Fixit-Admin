import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MdArrowBack, MdPhone, MdEmail, MdLocationOn, MdBadge, MdWork,
  MdCheckCircle, MdTrendingUp, MdStar, MdCreditCard,
} from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Stars from '../components/ui/Stars'
import DataTable from '../components/ui/DataTable'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { statusColors, statusDotColors, specialtyColors } from '../constants/status'

export default function TechnicianDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tech, setTech] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/technicians/${id}/details`)
      .then(res => setTech(res.data))
      .catch(() => toast.error('Failed to load technician'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleAvailability = async () => {
    try {
      await api.put(`/technicians/${id}`, { isAvailable: !tech.isAvailable })
      setTech(prev => ({ ...prev, isAvailable: !prev.isAvailable }))
      toast.success(`Marked ${!tech.isAvailable ? 'available' : 'unavailable'}`)
    } catch {
      toast.error('Failed to update')
    }
  }

  if (loading) {
    return (
      <div className="animate-fadeIn max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
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
      accessorKey: 'assignedAt',
      header: 'Assigned',
      cell: ({ getValue }) => <span className="text-gray-500 text-xs">{new Date(getValue()).toLocaleDateString()}</span>,
    },
    {
      accessorKey: 'completedAt',
      header: 'Completed',
      cell: ({ getValue }) => getValue()
        ? <span className="text-green-600 text-xs">{new Date(getValue()).toLocaleDateString()}</span>
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
    <div className="animate-fadeIn max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/technicians')} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-atoll-600 transition-colors mb-5">
        <MdArrowBack size={16} /> Back to technicians
      </button>

      {/* === SINGLE CARD LAYOUT === */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-gray-900">{tech.name}</h1>
              {tech.specialty && (
                <Badge className={specialtyColors[tech.specialty] || 'bg-gray-100 text-gray-700'}>
                  {tech.specialty}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">Joined {new Date(tech.joinedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAvailability}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-ring ${
                tech.isAvailable
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {tech.isAvailable ? 'Available' : 'Unavailable'}
            </button>
          </div>
        </div>

        {/* Profile Section */}
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
            <Field label="Joined" value={new Date(tech.joinedAt).toLocaleDateString()} muted />
          </div>
        </Section>

        {/* Performance Stats */}
        <Section title="Performance">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

        {/* Assignment History */}
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
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 font-medium mt-1">{label}</p>
    </div>
  )
}
