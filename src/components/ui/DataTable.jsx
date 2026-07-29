import { useState, useMemo, useRef, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { MdUnfoldMore, MdExpandLess, MdExpandMore, MdChevronLeft, MdChevronRight, MdViewColumn } from 'react-icons/md'
import EmptyState from './EmptyState'
import Spinner from './Spinner'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export default function DataTable({
  columns,
  data,
  loading = false,
  serverPagination = false,
  totalCount,
  page,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  initialSorting = [],
  enableColumnVisibility = false,
  initialColumnVisibility = {},
  columnVisibility: controlledColumnVisibility,
  onRowClick,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyIcon,
  stickyHeader = true,
}) {
  const [sorting, setSorting] = useState(initialSorting)
  const [internalColumnVisibility, setInternalColumnVisibility] = useState(initialColumnVisibility)
  const columnVisibility = controlledColumnVisibility || internalColumnVisibility
  const setColumnVisibility = setInternalColumnVisibility
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const columnMenuRef = useRef(null)

  useEffect(() => {
    if (!showColumnMenu) return
    const handler = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setShowColumnMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showColumnMenu])

  const tableConfig = {
    data: data || [],
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  }

  if (!serverPagination) {
    tableConfig.getPaginationRowModel = getPaginationRowModel()
    tableConfig.initialState = { pagination: { pageSize } }
  } else {
    tableConfig.manualPagination = true
    tableConfig.pageCount = Math.ceil((totalCount || 0) / pageSize)
  }

  const table = useReactTable(tableConfig)

  const currentPage = serverPagination ? page : table.getState().pagination.pageIndex + 1
  const totalPages = serverPagination
    ? Math.ceil((totalCount || 0) / pageSize)
    : table.getPageCount()
  const totalItems = serverPagination ? totalCount : data?.length || 0
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const goToPage = (p) => {
    if (serverPagination) onPageChange?.(p)
    else table.setPageIndex(p - 1)
  }

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages]
    if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }, [totalPages, currentPage])

  return (
    <div className="relative">
      {/* Column visibility toggle */}
      {enableColumnVisibility && (
        <div className="flex justify-end px-5 py-2 border-b border-gray-100">
          <div className="relative" ref={columnMenuRef}>
            <button
              onClick={() => setShowColumnMenu(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors focus-ring ${
                showColumnMenu ? 'text-atoll-600 bg-atoll-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              aria-label="Toggle column visibility"
            >
              <MdViewColumn size={15} /> Columns
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg z-20 py-1.5 min-w-[180px] shadow-sm">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Toggle columns</p>
                {table.getAllLeafColumns().map(col => {
                  if (col.columnDef.enableHiding === false) return null
                  return (
                    <label key={col.id} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={col.getIsVisible()}
                        onChange={col.getToggleVisibilityHandler()}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-atoll-600 focus:ring-atoll-500"
                      />
                      {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (data?.length || 0) === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
        ) : (
          <table className="w-full">
            <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} className="border-b-2 border-gray-200">
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide bg-gray-50 whitespace-nowrap select-none"
                      style={{ width: header.column.columnDef.size }}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className={`inline-flex items-center gap-1.5 ${
                            header.column.getCanSort() ? 'cursor-pointer hover:text-gray-900 transition-colors' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                          disabled={!header.column.getCanSort()}
                          aria-label={`Sort by ${typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : header.column.id}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-gray-400">
                              {{ asc: <MdExpandLess size={16} className="text-atoll-600" />, desc: <MdExpandMore size={16} className="text-atoll-600" /> }[header.column.getIsSorted()] ?? <MdUnfoldMore size={14} />}
                            </span>
                          )}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } hover:bg-atoll-50/40`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 py-3 text-sm text-gray-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer: rows per page + pagination */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value)
                if (serverPagination) onPageSizeChange?.(newSize)
                else table.setPageSize(newSize)
              }}
              className="border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-600 outline-none focus-ring hover:border-gray-300 bg-white cursor-pointer"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400">
              Showing {startItem}–{endItem} of {totalItems}
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed focus-ring rounded-md px-2 py-1.5 hover:bg-white transition-colors"
                aria-label="Previous page"
              >
                <MdChevronLeft size={18} /> Prev
              </button>
              <div className="flex items-center gap-0.5" role="navigation" aria-label="Pagination">
                {pageNumbers.map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-gray-400 text-xs select-none">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-7 h-7 rounded-md text-xs font-medium focus-ring transition-colors ${
                        p === currentPage
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-500 hover:bg-white hover:text-gray-700'
                      }`}
                      aria-label={`Page ${p}`}
                      aria-current={p === currentPage ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed focus-ring rounded-md px-2 py-1.5 hover:bg-white transition-colors"
                aria-label="Next page"
              >
                Next <MdChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
