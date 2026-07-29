import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { MdDownload, MdSearch, MdClear, MdFilterList, MdKeyboardArrowDown, MdVisibility, MdViewColumn } from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import Stars from '../components/ui/Stars'
import DataTable from '../components/ui/DataTable'
import Select from '../components/ui/Select'
import useDebounce from '../hooks/useDebounce'
import { statuses, serviceTypes, ratingOptions, ratingLabels, statusDotColors } from '../constants/status'

const DEFAULT_PAGE_SIZE = 10

export default function ServiceRequests() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState({ requestCode: false, rating: false })
  const columnMenuRef = useRef(null)

  useEffect(() => {
    if (!showColumnMenu) return
    const handler = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) setShowColumnMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showColumnMenu])

  const statusFilter = searchParams.get('status') || ''
  const typeFilter = searchParams.get('serviceType') || ''
  const ratingFilter = searchParams.get('rating') || ''
  const dateFrom = searchParams.get('from') || ''
  const dateTo = searchParams.get('to') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10)

  const debouncedSearch = useDebounce(search, 400)

  const setFilter = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page' && key !== 'pageSize') params.set('page', '1')
    setSearchParams(params)
  }, [searchParams, setSearchParams])

  const clearFilters = () => {
    setSearch('')
    setSearchParams({})
  }

  const activeFilterCount = [typeFilter, ratingFilter, dateFrom, dateTo].filter(Boolean).length
  const hasFilters = statusFilter || typeFilter || ratingFilter || dateFrom || dateTo || search

  const fetchRequests = useCallback(() => {
    setLoading(true)
    const params = { page, pageSize }
    if (debouncedSearch) params.search = debouncedSearch
    if (statusFilter) params.status = statusFilter
    if (typeFilter) params.serviceType = typeFilter
    if (ratingFilter) params.rating = ratingFilter
    if (dateFrom) params.from = dateFrom
    if (dateTo) params.to = dateTo

    api.get('/servicerequests', { params })
      .then(res => {
        setRequests(res.data.data)
        setTotalCount(res.data.totalCount)
      })
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false))
  }, [statusFilter, typeFilter, ratingFilter, dateFrom, dateTo, page, pageSize, debouncedSearch])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // Sync debounced search to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (debouncedSearch) params.set('search', debouncedSearch)
    else params.delete('search')
    if (params.get('page') !== '1' && debouncedSearch !== (searchParams.get('search') || '')) {
      params.set('page', '1')
    }
    setSearchParams(params, { replace: true })
  }, [debouncedSearch])

  const handleExport = async () => {
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.serviceType = typeFilter
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo

      const res = await api.get('/servicerequests/export', { params, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `ServiceRequests_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Excel exported')
    } catch {
      toast.error('Export failed')
    }
  }

  const toggleColumn = (key) => {
    setColumnVisibility(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const columnDefs = [
    { key: 'id', label: 'ID' },
    { key: 'requestCode', label: 'Code' },
    { key: 'customerName', label: 'Customer' },
    { key: 'serviceType', label: 'Service' },
    { key: 'status', label: 'Status' },
    { key: 'rating', label: 'Rating' },
    { key: 'technician', label: 'Technician' },
    { key: 'createdAt', label: 'Date' },
  ]

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 80,
      cell: ({ row }) => (
        <span className="text-atoll-600 font-semibold text-sm">#{row.original.id}</span>
      ),
    },
    {
      accessorKey: 'requestCode',
      header: 'Code',
      size: 100,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
          {getValue() || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{row.original.customerName}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{row.original.customerPhone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'serviceType',
      header: 'Service',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ getValue }) => getValue()
        ? <span className="text-sm text-yellow-500 font-medium">{getValue()}★</span>
        : <span className="text-gray-300 text-xs">-</span>,
    },
    {
      id: 'technician',
      header: 'Technician',
      accessorFn: row => row.assignments?.length > 0 ? row.assignments.map(a => a.technicianName).join(', ') : '',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">
          {getValue() || <span className="text-gray-300 italic text-xs">Unassigned</span>}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ getValue }) => (
        <div>
          <p className="text-xs font-medium text-gray-600">{new Date(getValue()).toLocaleDateString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{new Date(getValue()).toLocaleTimeString()}</p>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      size: 80,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Link
          to={`/requests/${row.original.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-atoll-600 hover:bg-atoll-50 border border-atoll-200 transition-colors"
        >
          <MdVisibility size={14} /> View
        </Link>
      ),
    },
  ], [])

  const statusTabs = useMemo(() => [
    { label: 'All', value: '' },
    ...statuses.map(s => ({ label: s === 'InProgress' ? 'In Progress' : s, value: s }))
  ], [])

  return (
    <div>
      <PageHeader
        title="Service Requests"
        actions={
          <Button onClick={handleExport} variant="outline" size="md">
            <MdDownload size={16} /> Export Excel
          </Button>
        }
      />

      {/* Status Tabs + Search + Filters */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {/* Status pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {statusTabs.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter('status', statusFilter === value ? '' : value)}
              className={`w-[108px] inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {value && <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === value ? 'bg-white' : statusDotColors[value]}`} />}
              {label}
            </button>
          ))}
        </div>

        {/* Search + Filter controls */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone..."
              className="w-52 pl-8 pr-8 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus-ring hover:border-gray-300 focus:border-atoll-500 transition-all"
              aria-label="Search requests"
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
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-atoll-200 bg-atoll-50 text-atoll-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <MdFilterList size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-atoll-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <MdKeyboardArrowDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <div className="relative" ref={columnMenuRef}>
            <button
              onClick={() => setShowColumnMenu(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                showColumnMenu
                  ? 'border-atoll-200 bg-atoll-50 text-atoll-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <MdViewColumn size={16} /> Columns
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg z-30 py-1.5 min-w-[180px] shadow-sm">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Toggle columns</p>
                {columnDefs.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={columnVisibility[key] !== false}
                      onChange={() => toggleColumn(key)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-atoll-600 focus:ring-atoll-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50"
              title="Clear all filters"
            >
              <MdClear size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Service Type</label>
              <Select
                value={typeFilter}
                onChange={(e) => setFilter('serviceType', e.target.value)}
                aria-label="Filter by service type"
              >
                <option value="">All Types</option>
                {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Rating</label>
              <Select
                value={ratingFilter}
                onChange={(e) => setFilter('rating', e.target.value)}
                aria-label="Filter by rating"
              >
                {ratingOptions.map(r => <option key={r} value={r}>{ratingLabels[r]}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setFilter('from', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus-ring hover:border-atoll-300 focus:border-atoll-500"
                aria-label="Date from"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setFilter('to', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus-ring hover:border-atoll-300 focus:border-atoll-500"
                aria-label="Date to"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={requests}
          loading={loading}
          serverPagination
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={(p) => setFilter('page', String(p))}
          onPageSizeChange={(size) => {
            const params = new URLSearchParams(searchParams)
            params.set('pageSize', String(size))
            params.set('page', '1')
            setSearchParams(params)
          }}
          onRowClick={(row) => navigate(`/requests/${row.id}`)}
          columnVisibility={columnVisibility}
          emptyTitle="No requests found"
          emptyDescription={hasFilters ? 'Try adjusting your search or filters' : 'No service requests yet'}
        />
      </div>
    </div>
  )
}
