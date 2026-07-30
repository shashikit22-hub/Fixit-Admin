import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MdPhone, MdWhatsapp, MdLocationOn, MdHome, MdOpenInNew,
  MdPerson, MdCheckCircle, MdPhotoCamera, MdVideocam,
  MdContentCopy, MdEdit, MdChevronLeft, MdChevronRight, MdCancel,
  MdRefresh, MdSend,
} from 'react-icons/md'
import toast from 'react-hot-toast'
import api, { mediaUrl } from '../services/api'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Skeleton } from '../components/ui/Skeleton'
import { statuses, statusColors, statusDotColors, assignmentStatusColors } from '../constants/status'

const IST = { timeZone: 'Asia/Kolkata' }
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', IST)
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { ...IST, hour: '2-digit', minute: '2-digit', hour12: true })
const fmtDateTime = (d) => `${fmtDate(d)}, ${fmtTime(d)}`

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [selectedTech, setSelectedTech] = useState('')
  const [assignNote, setAssignNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [nextDisabled, setNextDisabled] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const fetchData = () => {
    setLoading(true)
    setNextDisabled(false)
    Promise.all([
      api.get(`/servicerequests/${id}`),
      api.get('/technicians'),
    ]).then(([reqRes, techRes]) => {
      setRequest(reqRes.data)
      setTechnicians(techRes.data.data)
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [id])

  const handleStatusChange = async (newStatus) => {
    setStatusMenuOpen(false)
    try {
      const { data } = await api.put(`/servicerequests/${id}/status`, { status: newStatus })
      setRequest(prev => ({ ...prev, ...data }))
      toast.success(`Status updated to ${newStatus === 'InProgress' ? 'In Progress' : newStatus}`)
    } catch { toast.error('Failed to update status') }
  }

  const handleCancel = async () => {
    setCancelLoading(true)
    try {
      const { data } = await api.put(`/servicerequests/${id}/status`, { status: 'Cancelled' })
      setRequest(prev => ({ ...prev, ...data }))
      setShowCancelDialog(false)
      toast.success('Request cancelled')
    } catch {
      toast.error('Failed to cancel request')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!selectedTech) return toast.error('Select a technician')
    try {
      await api.post('/assignments', { serviceRequestId: parseInt(id), technicianId: parseInt(selectedTech), notes: assignNote || null })
      const { data } = await api.get(`/servicerequests/${id}`)
      setRequest(data)
      setSelectedTech('')
      setAssignNote('')
      toast.success('Technician assigned')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign') }
  }

  const handleComplete = async (assignmentId) => {
    try {
      await api.put(`/assignments/${assignmentId}/complete`)
      const { data } = await api.get(`/servicerequests/${id}`)
      setRequest(data)
      toast.success('Assignment marked completed')
    } catch { toast.error('Failed to complete') }
  }

  const handleResend = async (assignmentId) => {
    try {
      await api.post(`/assignments/${assignmentId}/resend`)
      toast.success('Notification resent to technician')
    } catch { toast.error('Failed to resend') }
  }

  const handlePrev = () => {
    const prevId = parseInt(id) - 1
    if (prevId >= 1) navigate(`/requests/${prevId}`)
  }

  const handleNext = () => {
    const nextId = parseInt(id) + 1
    api.get(`/servicerequests/${nextId}`)
      .then(() => navigate(`/requests/${nextId}`))
      .catch(() => {
        setNextDisabled(true)
        toast.error('No next request')
      })
  }

  // Group technicians by specialty
  const groupedTechnicians = useMemo(() => {
    if (!technicians.length) return []
    const groups = {}
    technicians.forEach(t => {
      const specialty = t.specialty || 'General'
      if (!groups[specialty]) groups[specialty] = []
      groups[specialty].push(t)
    })
    return Object.keys(groups)
      .sort()
      .map(specialty => ({
        specialty,
        techs: groups[specialty].sort((a, b) => a.name.localeCompare(b.name)),
      }))
  }, [technicians])

  if (loading) {
    return (
      <div className="animate-fadeIn  space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 text-lg mb-4">Request not found</p>
        <Button onClick={() => navigate('/requests')} variant="outline">Back to Requests</Button>
      </div>
    )
  }

  const hasLocation = request.latitude && request.longitude
  const mapsUrl = hasLocation ? `https://www.google.com/maps?q=${request.latitude},${request.longitude}` : null
  const mapsEmbedUrl = hasLocation ? `https://maps.google.com/maps?q=${request.latitude},${request.longitude}&z=15&output=embed` : null
  const customerPhone = request.customerPhone?.replace(/[^0-9]/g, '')
  const whatsappLink = customerPhone ? `https://wa.me/${customerPhone}` : null
  const statusLabel = request.status === 'InProgress' ? 'In Progress' : request.status
  const canCancel = request.status !== 'Completed' && request.status !== 'Cancelled'

  const timeline = []
  timeline.push({ label: 'Request created', time: request.createdAt, dot: 'bg-gray-300' })
  request.assignments?.forEach(a => {
    timeline.push({ label: `Assigned to ${a.technicianName}`, time: a.assignedAt, dot: 'bg-blue-400' })
    if (a.acceptedAt) timeline.push({ label: `${a.technicianName} accepted`, time: a.acceptedAt, dot: 'bg-green-400' })
    if (a.rejectedAt) timeline.push({ label: `${a.technicianName} rejected`, time: a.rejectedAt, dot: 'bg-red-400' })
    if (a.completedAt) timeline.push({ label: `${a.technicianName} completed`, time: a.completedAt, dot: 'bg-green-400' })
  })
  if (request.updatedAt && request.status === 'Completed') timeline.push({ label: 'Request completed', time: request.updatedAt, dot: 'bg-green-400' })
  if (request.ratedAt) timeline.push({ label: `Customer rated ${request.rating}★`, time: request.ratedAt, dot: 'bg-yellow-400' })
  timeline.sort((a, b) => new Date(a.time) - new Date(b.time))

  return (
    <div className="animate-fadeIn ">
      {/* Breadcrumbs via PageHeader */}
      <PageHeader
        title={`Request #${request.id}`}
        subtitle={`${request.serviceType} · ${fmtDateTime(request.createdAt)}`}
        breadcrumbs={[
          { label: 'Service Requests', to: '/requests' },
          { label: `Request #${id}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* Prev/Next nav */}
            <div className="flex items-center gap-1 mr-1">
              <button
                onClick={handlePrev}
                disabled={parseInt(id) <= 1}
                className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous request"
              >
                <MdChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                disabled={nextDisabled}
                className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next request"
              >
                <MdChevronRight size={18} />
              </button>
            </div>

            {/* Status dropdown */}
            <div className="relative print:hidden">
              <button
                onClick={() => setStatusMenuOpen(v => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusColors[request.status]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusDotColors[request.status]}`} />
                {statusLabel}
                <MdEdit size={11} className="opacity-60" />
              </button>
              {statusMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setStatusMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg z-30 py-1 min-w-[160px] shadow-sm">
                    {statuses.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={request.status === s}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${request.status === s ? 'text-gray-400 bg-gray-50' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${statusDotColors[s]}`} />
                        {s === 'InProgress' ? 'In Progress' : s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Cancel button */}
            {canCancel && (
              <Button onClick={() => setShowCancelDialog(true)} variant="danger" size="sm" className="print:hidden">
                <MdCancel size={14} /> Cancel Request
              </Button>
            )}

            {/* Refresh */}
            <button
              onClick={fetchData}
              className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors print:hidden"
              title="Refresh"
            >
              <MdRefresh size={16} />
            </button>

            {/* WhatsApp + Call */}
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors print:hidden" title="WhatsApp"><MdWhatsapp size={16} /></a>
            )}
            <a href={`tel:${customerPhone}`} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors print:hidden" title="Call"><MdPhone size={16} /></a>

          </div>
        }
      />

      {/* === TWO COLUMN LAYOUT === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="print-content">

        {/* ── Left Column: Request Details ── */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">

          {/* ── Section: Customer ── */}
          <Section title="Customer">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
              <Field label="Name" value={request.customerName} />
              <Field label="Phone" value={
                <span className="flex items-center gap-1.5">
                  {request.customerPhone}
                  <button onClick={() => { navigator.clipboard.writeText(request.customerPhone); toast.success('Copied') }} className="text-gray-300 hover:text-gray-500 print:hidden"><MdContentCopy size={12} /></button>
                </span>
              } />
              <Field label="Service" value={request.serviceType} />
              {request.alternatePhone && <Field label="Alt. Phone" value={request.alternatePhone} />}
              <Field label="Created" value={fmtDateTime(request.createdAt)} muted />
              {request.updatedAt && <Field label="Updated" value={fmtDateTime(request.updatedAt)} muted />}
            </div>
          </Section>

          {/* ── Section: Description ── */}
          {request.description && (
            <Section title="Description">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{request.description}</p>
            </Section>
          )}

          {/* ── Section: Location ── */}
          {(hasLocation || request.address || request.houseNumber) && (
            <Section title="Location">
              <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-3">
                {request.address && <span className="flex items-center gap-1.5"><MdLocationOn size={15} className="text-gray-400" /> {request.address}</span>}
                {request.houseNumber && <span className="flex items-center gap-1.5"><MdHome size={15} className="text-gray-400" /> House {request.houseNumber}</span>}
              </div>
              {hasLocation && (
                <>
                  <div className="rounded-lg overflow-hidden border border-gray-200 print:hidden" style={{ height: '180px' }}>
                    <iframe title="Map" src={mapsEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  </div>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-atoll-600 hover:text-atoll-700 font-medium print:hidden">
                    Open in Google Maps <MdOpenInNew size={11} />
                  </a>
                </>
              )}
            </Section>
          )}

          {/* ── Section: Media ── */}
          {(mediaUrl(request.photoUrl) || mediaUrl(request.videoUrl)) && (
            <Section title="Media">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mediaUrl(request.photoUrl) && (
                  <div
                    className="group relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-atoll-300 transition-colors"
                    onClick={() => setLightbox(mediaUrl(request.photoUrl))}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setLightbox(mediaUrl(request.photoUrl)) }}
                  >
                    <img src={mediaUrl(request.photoUrl)} alt="Issue" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"><MdPhotoCamera size={11} /> Photo</span>
                  </div>
                )}
                {mediaUrl(request.videoUrl) && (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <video src={mediaUrl(request.videoUrl)} controls className="w-full h-44 object-cover bg-black" />
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"><MdVideocam size={11} /> Video</span>
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* ── Right Column: Assignments + Activity ── */}
        <div className="space-y-4">

          {/* Assignments Card */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Section title="Assignments" count={request.assignments?.length}>
              {/* Assign form */}
              <form onSubmit={handleAssign} className="space-y-2 mb-4 pb-4 border-b border-gray-100 print:hidden">
                <Select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} aria-label="Select technician">
                  <option value="">Select technician...</option>
                  {groupedTechnicians.map(({ specialty, techs }) => (
                    <optgroup key={specialty} label={specialty}>
                      {techs.map(t => (
                        <option key={t.id} value={t.id} disabled={!t.isAvailable}>
                          {t.name}{!t.isAvailable ? ' (Busy)' : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
                <input
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus-ring hover:border-atoll-300 focus:border-atoll-500"
                />
                <Button type="submit" size="md" className="w-full">Assign</Button>
              </form>

              {/* Assignment list */}
              {request.assignments?.length > 0 ? (
                <div className="space-y-3">
                  {request.assignments.map(a => {
                    const cardBg = a.status === 'Accepted' || a.status === 'Completed' ? 'bg-green-50/50'
                      : a.status === 'Rejected' ? 'bg-red-50/30'
                      : 'bg-gray-50/50'
                    const avatarBg = a.status === 'Accepted' || a.status === 'Completed' ? 'bg-green-100 text-green-700'
                      : a.status === 'Rejected' ? 'bg-red-100 text-red-700'
                      : 'bg-atoll-100 text-atoll-700'
                    return (
                      <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg ${cardBg}`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarBg}`}>
                          {a.technicianName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-800 truncate">{a.technicianName}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${assignmentStatusColors[a.status] || 'bg-gray-100 text-gray-700'}`}>
                              {a.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{a.technicianPhone} &middot; Assigned {fmtDateTime(a.assignedAt)}</p>
                          {a.notes && <p className="text-xs text-gray-500 italic mt-1">{a.notes}</p>}
                          {a.completedAt && (
                            <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1"><MdCheckCircle size={12} /> Completed {fmtDateTime(a.completedAt)}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 print:hidden">
                            {a.status === 'Accepted' && !a.completedAt && (
                              <Button onClick={() => handleComplete(a.id)} variant="outline" size="sm">
                                <MdCheckCircle size={14} /> Mark Done
                              </Button>
                            )}
                            {a.status === 'Pending' && (
                              <Button onClick={() => handleResend(a.id)} variant="outline" size="sm">
                                <MdSend size={14} /> Resend
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <MdPerson size={28} className="text-gray-300 mx-auto mb-1" />
                  <p className="text-sm text-gray-400">No technicians assigned yet</p>
                </div>
              )}
            </Section>
          </div>

          {/* Activity Card */}
          {timeline.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <Section title="Activity" last>
                <div className="relative">
                  <div className="absolute left-[5px] top-1 bottom-1 w-px bg-gray-100" />
                  <div className="space-y-4">
                    {timeline.map((ev, i) => (
                      <div key={i} className="flex items-start gap-3 relative">
                        <div className={`w-[10px] h-[10px] rounded-full ${ev.dot} flex-shrink-0 mt-1.5 z-10 ring-2 ring-white`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">{ev.label}</p>
                          <p className="text-[11px] text-gray-400">{fmtDateTime(ev.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* Rating Card */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Section title="Rating" last>
              {request.rating ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{request.rating}</span>
                    <span className="text-yellow-500 text-lg">★</span>
                    <span className="text-sm text-gray-400">/ 5</span>
                  </div>
                  {request.ratedAt && <span className="text-xs text-gray-400">Rated on {fmtDate(request.ratedAt)}</span>}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Not yet rated</p>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Modal open={!!lightbox} onClose={() => setLightbox(null)} size="full">
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          {lightbox && <img src={lightbox} alt="Full size" className="max-w-full max-h-[80vh] object-contain rounded-lg" />}
        </div>
      </Modal>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title="Cancel Request?"
        message={`Are you sure you want to cancel request #${id}? This action cannot be undone.`}
        confirmText="Cancel Request"
        confirmVariant="danger"
        loading={cancelLoading}
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
