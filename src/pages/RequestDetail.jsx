import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MdArrowBack, MdPhone, MdWhatsapp, MdLocationOn, MdHome, MdOpenInNew,
  MdAccessTime, MdPerson, MdStar, MdCheckCircle, MdPhotoCamera, MdVideocam,
  MdContentCopy, MdEdit,
} from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { statuses, statusColors, statusDotColors } from '../constants/status'

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

  const fetchData = () => {
    setLoading(true)
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

  const timeline = []
  timeline.push({ label: 'Request created', time: request.createdAt, dot: 'bg-gray-300' })
  request.assignments?.forEach(a => {
    timeline.push({ label: `Assigned to ${a.technicianName}`, time: a.assignedAt, dot: 'bg-blue-400' })
    if (a.completedAt) timeline.push({ label: `${a.technicianName} completed`, time: a.completedAt, dot: 'bg-green-400' })
  })
  if (request.updatedAt && request.status === 'Completed') timeline.push({ label: 'Request completed', time: request.updatedAt, dot: 'bg-green-400' })
  if (request.ratedAt) timeline.push({ label: `Customer rated ${request.rating}★`, time: request.ratedAt, dot: 'bg-yellow-400' })
  timeline.sort((a, b) => new Date(a.time) - new Date(b.time))

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/requests')} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-atoll-600 transition-colors mb-5">
        <MdArrowBack size={16} /> Back to requests
      </button>

      {/* === SINGLE CARD LAYOUT === */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-gray-900">Request #{request.id}</h1>
              {request.requestCode && <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{request.requestCode}</span>}
            </div>
            <p className="text-sm text-gray-500">{request.serviceType} &middot; {new Date(request.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Status dropdown */}
            <div className="relative">
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
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors" title="WhatsApp"><MdWhatsapp size={16} /></a>
            )}
            <a href={`tel:${customerPhone}`} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors" title="Call"><MdPhone size={16} /></a>
          </div>
        </div>

        {/* ── Section: Customer ── */}
        <Section title="Customer">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
            <Field label="Name" value={request.customerName} />
            <Field label="Phone" value={
              <span className="flex items-center gap-1.5">
                {request.customerPhone}
                <button onClick={() => { navigator.clipboard.writeText(request.customerPhone); toast.success('Copied') }} className="text-gray-300 hover:text-gray-500"><MdContentCopy size={12} /></button>
              </span>
            } />
            {request.alternatePhone && <Field label="Alt. Phone" value={request.alternatePhone} />}
            <Field label="Service" value={request.serviceType} />
            <Field label="Created" value={new Date(request.createdAt).toLocaleString()} muted />
            {request.updatedAt && <Field label="Updated" value={new Date(request.updatedAt).toLocaleString()} muted />}
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
                <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '180px' }}>
                  <iframe title="Map" src={mapsEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-atoll-600 hover:text-atoll-700 font-medium">
                  Open in Google Maps <MdOpenInNew size={11} />
                </a>
              </>
            )}
          </Section>
        )}

        {/* ── Section: Media ── */}
        {(request.photoUrl || request.videoUrl) && (
          <Section title="Media">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {request.photoUrl && (
                <div
                  className="group relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-atoll-300 transition-colors"
                  onClick={() => setLightbox(request.photoUrl)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLightbox(request.photoUrl) }}
                >
                  <img src={request.photoUrl} alt="Issue" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"><MdPhotoCamera size={11} /> Photo</span>
                </div>
              )}
              {request.videoUrl && (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <video src={request.videoUrl} controls className="w-full h-44 object-cover bg-black" />
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"><MdVideocam size={11} /> Video</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Section: Rating ── */}
        <Section title="Rating">
          {request.rating ? (
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{request.rating}</span>
                <span className="text-yellow-500 text-lg">★</span>
                <span className="text-sm text-gray-400">/ 5</span>
              </div>
              {request.ratedAt && <span className="text-xs text-gray-400">Rated on {new Date(request.ratedAt).toLocaleDateString()}</span>}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Not yet rated</p>
          )}
        </Section>

        {/* ── Section: Assignments ── */}
        <Section title="Assignments" count={request.assignments?.length}>
          {/* Assign form */}
          <form onSubmit={handleAssign} className="flex flex-col sm:flex-row gap-2 mb-4 pb-4 border-b border-gray-100">
            <div className="flex-1">
              <Select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} aria-label="Select technician">
                <option value="">Select technician...</option>
                {technicians.filter(t => t.isAvailable).map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.specialty}</option>
                ))}
              </Select>
            </div>
            <input
              value={assignNote}
              onChange={(e) => setAssignNote(e.target.value)}
              placeholder="Note (optional)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus-ring hover:border-atoll-300 focus:border-atoll-500"
            />
            <Button type="submit" size="md">Assign</Button>
          </form>

          {/* Assignment list */}
          {request.assignments?.length > 0 ? (
            <div className="space-y-3">
              {request.assignments.map(a => (
                <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg ${a.completedAt ? 'bg-green-50/50' : 'bg-gray-50/50'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${a.completedAt ? 'bg-green-100 text-green-700' : 'bg-atoll-100 text-atoll-700'}`}>
                    {a.technicianName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.technicianName}</p>
                      {a.completedAt
                        ? <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">Done</span>
                        : <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">Active</span>
                      }
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{a.technicianPhone} &middot; Assigned {new Date(a.assignedAt).toLocaleDateString()}</p>
                    {a.notes && <p className="text-xs text-gray-500 italic mt-1">{a.notes}</p>}
                    {a.completedAt ? (
                      <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1"><MdCheckCircle size={12} /> Completed {new Date(a.completedAt).toLocaleString()}</p>
                    ) : (
                      <Button onClick={() => handleComplete(a.id)} variant="outline" size="sm" className="mt-2">
                        <MdCheckCircle size={14} /> Mark Done
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <MdPerson size={28} className="text-gray-300 mx-auto mb-1" />
              <p className="text-sm text-gray-400">No technicians assigned yet</p>
            </div>
          )}
        </Section>

        {/* ── Section: Activity ── */}
        {timeline.length > 0 && (
          <Section title="Activity" last>
            <div className="relative">
              <div className="absolute left-[5px] top-1 bottom-1 w-px bg-gray-100" />
              <div className="space-y-4">
                {timeline.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className={`w-[10px] h-[10px] rounded-full ${ev.dot} flex-shrink-0 mt-1.5 z-10 ring-2 ring-white`} />
                    <div className="flex-1 flex items-baseline justify-between gap-4">
                      <p className="text-sm text-gray-700">{ev.label}</p>
                      <p className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">{new Date(ev.time).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* Lightbox */}
      <Modal open={!!lightbox} onClose={() => setLightbox(null)} size="full">
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          {lightbox && <img src={lightbox} alt="Full size" className="max-w-full max-h-[80vh] object-contain rounded-lg" />}
        </div>
      </Modal>
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
