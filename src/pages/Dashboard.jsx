import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MdStar, MdRefresh, MdAssignment, MdPeople, MdToday,
  MdCheckCircle, MdTrendingUp,
} from 'react-icons/md'
import api from '../services/api'
import PageHeader from '../components/layout/PageHeader'
import Stars from '../components/ui/Stars'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { serviceTypeColors } from '../constants/status'

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  const fetchData = () => {
    setLoading(true)
    setError(false)
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SkeletonCard className="h-72" />
          <SkeletonCard className="h-72" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SkeletonCard className="h-60" />
          <SkeletonCard className="h-60" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-60" />
          <SkeletonCard className="h-60" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 text-lg mb-4">Failed to load dashboard</p>
        <Button onClick={fetchData} variant="secondary">
          <MdRefresh size={18} /> Retry
        </Button>
      </div>
    )
  }

  const totalActive = (data.newCount || 0) + (data.assignedCount || 0) + (data.inProgressCount || 0)

  const statCards = [
    {
      label: 'Total Requests',
      value: data.totalRequests,
      icon: MdAssignment,
      color: 'text-blue-600 bg-blue-50',
      click: '/requests',
    },
    {
      label: 'Active Requests',
      value: totalActive,
      icon: MdTrendingUp,
      color: 'text-purple-600 bg-purple-50',
      click: '/requests?status=New',
    },
    {
      label: 'Today New',
      value: data.todayNewCount ?? 0,
      icon: MdToday,
      color: 'text-amber-600 bg-amber-50',
      click: '/requests?status=New',
    },
    {
      label: 'Done Today',
      value: data.todayCompletedCount ?? 0,
      icon: MdCheckCircle,
      color: 'text-green-600 bg-green-50',
      click: '/requests?status=Completed',
    },
  ]

  const statuses = [
    { label: 'New', count: data.newCount, dot: 'bg-blue-400', status: 'New' },
    { label: 'Assigned', count: data.assignedCount, dot: 'bg-amber-400', status: 'Assigned' },
    { label: 'In Progress', count: data.inProgressCount, dot: 'bg-purple-400', status: 'InProgress' },
    { label: 'Completed', count: data.completedCount, dot: 'bg-green-400', status: 'Completed' },
    { label: 'Cancelled', count: data.cancelledCount, dot: 'bg-red-400', status: 'Cancelled' },
  ]

  const serviceTypeDist = data.serviceTypeDistribution || {}
  const maxTypeCount = Math.max(...Object.values(serviceTypeDist), 1)

  const totalRatings = data.ratingDistribution
    ? Object.values(data.ratingDistribution).reduce((a, b) => a + b, 0)
    : 0

  const availableTechs = data.availableTechnicians ?? 0
  const totalTechs = data.totalTechnicians ?? 0
  const busyTechs = totalTechs - availableTechs
  const techAvailPct = totalTechs > 0 ? (availableTechs / totalTechs) * 100 : 0

  // Weekly trend data
  const weeklyTrend = data.weeklyTrend || []
  const maxTrendCount = Math.max(...weeklyTrend.flatMap(d => [d.newCount, d.completedCount]), 1)
  const weekTotalNew = weeklyTrend.reduce((s, d) => s + d.newCount, 0)
  const weekTotalCompleted = weeklyTrend.reduce((s, d) => s + d.completedCount, 0)

  // Top technicians
  const topTechnicians = data.topTechnicians || []

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Dashboard" />

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, click }) => (
          <button
            key={label}
            onClick={() => click && navigate(click)}
            className={`bg-white rounded-lg border border-gray-200 p-4 text-left transition-all hover:shadow-sm ${click ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`inline-flex p-2 rounded-lg mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">{label}</p>
          </button>
        ))}
      </div>

      {/* Row 2: Recent Requests + Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 ">

        {/* Recent Requests */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Recent Requests</p>
            <button
              onClick={() => navigate('/requests')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          {data.recentRequests && data.recentRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-gray-100">
                    <th className="px-5 py-2 text-left text-[11px] text-gray-400 font-medium uppercase">Customer</th>
                    <th className="px-3 py-2 text-left text-[11px] text-gray-400 font-medium uppercase">Service</th>
                    <th className="px-3 py-2 text-left text-[11px] text-gray-400 font-medium uppercase">Status</th>
                    <th className="px-3 py-2 text-right text-[11px] text-gray-400 font-medium uppercase pr-5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentRequests.map(req => (
                    <tr
                      key={req.id}
                      onClick={() => navigate(`/requests/${req.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-2.5 text-gray-700 font-medium truncate max-w-[140px]">{req.customerName}</td>
                      <td className="px-3 py-2.5 text-gray-500 truncate max-w-[120px]">{req.serviceType}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={req.status} /></td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs text-right pr-5 whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 pb-5 text-gray-400 text-sm">No requests yet</p>
          )}
        </div>

        {/* Weekly Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Weekly Trend</p>
          {weeklyTrend.length > 0 ? (
            <>
              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                  <span className="text-gray-500">New</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-500" />
                  <span className="text-gray-500">Completed</span>
                </span>
              </div>
              {/* Spacer to push bars toward bottom */}
              <div className="flex-1" />
              {/* Bars */}
              <div className="flex items-end gap-3">
                {weeklyTrend.map((day, i) => {
                  const d = new Date(day.date)
                  const label = dayLabels[d.getDay()]
                  const barMaxH = 120
                  const newH = maxTrendCount > 0 ? Math.round((day.newCount / maxTrendCount) * barMaxH) : 0
                  const compH = maxTrendCount > 0 ? Math.round((day.completedCount / maxTrendCount) * barMaxH) : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="flex items-end gap-1 w-full justify-center" style={{ height: `${barMaxH + 18}px` }}>
                        <div className="w-2/5 flex flex-col items-end justify-end">
                          {day.newCount > 0 && (
                            <span className="text-[10px] font-semibold text-blue-600 mb-0.5 self-center">{day.newCount}</span>
                          )}
                          <div
                            className="w-full bg-blue-500 rounded-md transition-all hover:bg-blue-600"
                            style={{ height: `${newH}px`, minHeight: day.newCount > 0 ? '6px' : '0px' }}
                          />
                        </div>
                        <div className="w-2/5 flex flex-col items-end justify-end">
                          {day.completedCount > 0 && (
                            <span className="text-[10px] font-semibold text-green-600 mb-0.5 self-center">{day.completedCount}</span>
                          )}
                          <div
                            className="w-full bg-green-500 rounded-md transition-all hover:bg-green-600"
                            style={{ height: `${compH}px`, minHeight: day.completedCount > 0 ? '6px' : '0px' }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-gray-500">{label}</span>
                    </div>
                  )
                })}
              </div>
              {/* Footer summary */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span>Week total: <span className="font-semibold text-blue-600">{weekTotalNew}</span> new</span>
                <span><span className="font-semibold text-green-600">{weekTotalCompleted}</span> completed</span>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No trend data available</p>
          )}
        </div>
      </div>

      {/* Row 3: Service Types + Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 ">

        {/* Service Types — vertical bar chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Service Types</p>
          {Object.keys(serviceTypeDist).length > 0 ? (
            <>
              <div className="flex-1" />
              <div className="flex items-end gap-3" style={{ minHeight: '140px' }}>
                {Object.entries(serviceTypeDist)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const barMaxH = 120
                    const h = maxTypeCount > 0 ? Math.round((count / maxTypeCount) * barMaxH) : 0
                    const color = serviceTypeColors[type] || 'bg-gray-400'
                    const hoverColor = color.replace('bg-', 'hover:bg-').replace('500', '600').replace('700', '800')
                    return (
                      <div key={type} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="flex flex-col items-center justify-end" style={{ height: `${barMaxH + 18}px` }}>
                          {count > 0 && (
                            <span className="text-[10px] font-semibold text-gray-600 mb-0.5">{count}</span>
                          )}
                          <div
                            className={`w-8 ${color} rounded-md transition-all ${hoverColor}`}
                            style={{ height: `${h}px`, minHeight: count > 0 ? '6px' : '0px' }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">{type}</span>
                      </div>
                    )
                  })}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span>Total</span>
                <span className="font-semibold text-gray-700">{Object.values(serviceTypeDist).reduce((a, b) => a + b, 0)} requests</span>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No requests yet</p>
          )}
        </div>

        {/* Rating Overview — keep original */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Rating Overview</p>
          {data.averageRating ? (
            <>
              <div className="flex items-center gap-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-bold text-gray-900">{data.averageRating}</span>
                  <MdStar size={28} className="text-yellow-400" />
                </div>
                <div>
                  <Stars rating={Math.round(data.averageRating)} size={18} />
                  <p className="text-xs text-gray-400 mt-1">{totalRatings} total ratings</p>
                </div>
              </div>
              {data.ratingDistribution && Object.keys(data.ratingDistribution).length > 0 && (
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = data.ratingDistribution[star] || 0
                    const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-gray-500 text-right font-medium">{star}</span>
                        <MdStar size={14} className="text-yellow-400" />
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-yellow-400 rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-gray-400">{count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-sm">No ratings yet</p>
          )}
        </div>
      </div>

      {/* Row 4: Top Technicians + Technician Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">

        {/* Top Performing Technicians */}
        <div className="bg-white rounded-lg border border-gray-200 flex flex-col">
          <p className="px-5 pt-5 pb-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Top Performing Technicians</p>
          {topTechnicians.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {topTechnicians.map((tech, idx) => {
                const rankColors = ['bg-yellow-400 text-yellow-900', 'bg-gray-300 text-gray-700', 'bg-amber-600 text-white']
                const rankClass = idx < 3 ? rankColors[idx] : 'bg-gray-100 text-gray-500'
                return (
                  <button
                    key={tech.id}
                    onClick={() => navigate(`/technicians/${tech.id}`)}
                    className="flex items-center w-full px-5 py-3 hover:bg-gray-50 transition-colors text-left gap-3"
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankClass}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 font-medium truncate">{tech.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{tech.specialty || 'General'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{tech.completedJobs} <span className="text-gray-400 font-normal text-xs">jobs</span></p>
                      {tech.averageRating != null && (
                        <p className="text-[11px] text-gray-400 flex items-center justify-end gap-0.5">
                          <MdStar size={12} className="text-yellow-400" />
                          {tech.averageRating}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="px-5 pb-5 text-gray-400 text-sm">No completed jobs yet</p>
          )}
        </div>

        {/* Technician Overview — vertical bar chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Technician Overview</p>
          <div className="flex-1" />
          <div className="flex items-end gap-4" style={{ minHeight: '100px' }}>
            {[
              { label: 'Available', value: availableTechs, color: 'bg-green-500', hover: 'hover:bg-green-600' },
              { label: 'Busy', value: busyTechs, color: 'bg-amber-500', hover: 'hover:bg-amber-600' },
              { label: 'Pending', value: data.pendingAssignments ?? 0, color: 'bg-red-500', hover: 'hover:bg-red-600' },
              { label: 'Total', value: totalTechs, color: 'bg-blue-500', hover: 'hover:bg-blue-600' },
            ].map(({ label, value, color, hover }) => {
              const barMaxH = 80
              const maxVal = Math.max(totalTechs, data.pendingAssignments ?? 0, 1)
              const h = maxVal > 0 ? Math.round((value / maxVal) * barMaxH) : 0
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="flex flex-col items-center justify-end" style={{ height: `${barMaxH + 18}px` }}>
                    <span className="text-[10px] font-semibold text-gray-600 mb-0.5">{value}</span>
                    <div
                      className={`w-10 ${color} rounded-md transition-all ${hover}`}
                      style={{ height: `${h}px`, minHeight: value > 0 ? '6px' : '0px' }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 text-center">{label}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span>Availability</span>
            <span className="font-semibold text-gray-700">{totalTechs > 0 ? Math.round(techAvailPct) : 0}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
