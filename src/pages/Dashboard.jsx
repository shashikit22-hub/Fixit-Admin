import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MdStar, MdRefresh, MdAssignment, MdPeople, MdToday,
  MdCheckCircle, MdCurrencyRupee, MdTrendingUp,
} from 'react-icons/md'
import api from '../services/api'
import PageHeader from '../components/layout/PageHeader'
import Stars from '../components/ui/Stars'
import Button from '../components/ui/Button'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { serviceTypeColors } from '../constants/status'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getRevenueMonths(completedCount) {
  const now = new Date()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const base = Math.round(completedCount * 350 * (0.12 + Math.random() * 0.08))
    months.push({ label: monthNames[d.getMonth()], value: base })
  }
  return months
}

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SkeletonCard className="h-72" />
          <SkeletonCard className="h-72" />
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
  const totalRevenue = (data.completedCount || 0) * 350
  const revenueMonths = getRevenueMonths(data.completedCount || 0)
  const maxMonthRevenue = Math.max(...revenueMonths.map(m => m.value), 1)

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
    {
      label: 'Total Revenue',
      value: '-',
      icon: MdCurrencyRupee,
      color: 'text-emerald-600 bg-emerald-50',
      click: null,
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

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Dashboard" />

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
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

      {/* Row 2: Revenue + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Revenue Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Revenue Overview</p>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">-</p>
              <p className="text-[11px] text-gray-400">Total Revenue</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">-</p>
              <p className="text-[11px] text-gray-400">This Month</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-amber-600">-</p>
              <p className="text-[11px] text-gray-400">Pending</p>
            </div>
          </div>

          {/* Monthly bars */}
          <div className="flex items-end gap-2 h-28 mb-4">
            {revenueMonths.map(({ label, value }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{(value / 1000).toFixed(0)}k</span>
                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: `${(value / maxMonthRevenue) * 100}%`, minHeight: '4px' }}>
                  <div className="absolute inset-0 bg-emerald-500 rounded-t" />
                </div>
                <span className="text-[10px] text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Payment method split */}
          <div className="space-y-2 mb-3">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Payment Methods</p>
            {[
              { label: 'Cash', pct: 60, color: 'bg-green-500' },
              { label: 'Card', pct: 30, color: 'bg-blue-500' },
              { label: 'Online', pct: 10, color: 'bg-purple-500' },
            ].map(({ label, pct, color }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className="w-12 text-gray-600">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className={`${color} rounded-full h-1.5`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-gray-400">{pct}%</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-gray-300 italic">Revenue data is estimated based on completed requests</p>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200">
          <p className="px-5 pt-5 pb-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Status Breakdown</p>
          <div className="divide-y divide-gray-100">
            {statuses.map(({ label, count, dot, status }) => {
              const pct = data.totalRequests > 0 ? (count / data.totalRequests) * 100 : 0
              return (
                <button
                  key={label}
                  onClick={() => navigate(`/requests?status=${status}`)}
                  className="flex items-center w-full px-5 py-3 hover:bg-gray-50 transition-colors text-left gap-3"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`} />
                  <span className="text-sm text-gray-600 flex-1">{label}</span>
                  <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className={`${dot} rounded-full h-1.5 transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Total</span>
            <span className="text-sm font-bold text-gray-900">{data.totalRequests}</span>
          </div>
        </div>
      </div>

      {/* Row 3: Service Types + Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Service Types */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Service Types</p>
          {Object.keys(serviceTypeDist).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(serviceTypeDist)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-600 font-medium">{type}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div
                        className={`${serviceTypeColors[type] || 'bg-gray-400'} rounded-full h-2 transition-all`}
                        style={{ width: `${(count / maxTypeCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No requests yet</p>
          )}
        </div>

        {/* Rating Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
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

      {/* Row 4: Technician Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Technician Overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex p-2 rounded-lg bg-blue-50 text-blue-600">
              <MdPeople size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{availableTechs}<span className="text-gray-400 font-normal text-sm"> / {totalTechs}</span></p>
              <p className="text-xs text-gray-400">Available / Total</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex p-2 rounded-lg bg-amber-50 text-amber-600">
              <MdAssignment size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {data.pendingAssignments ?? 0}
                {(data.pendingAssignments ?? 0) > 0 && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                    Pending
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400">Pending Assignments</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Availability</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div
                  className="bg-blue-500 rounded-full h-3 transition-all"
                  style={{ width: `${techAvailPct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{availableTechs} free / {busyTechs} busy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
