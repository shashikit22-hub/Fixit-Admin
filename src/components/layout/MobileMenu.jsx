import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { MdClose, MdLogout } from 'react-icons/md'
import useAuth from '../../hooks/useAuth'

export default function MobileMenu({ open, onClose, links, pendingCount }) {
  const { logout } = useAuth()
  const menuRef = useRef(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 animate-fadeIn" onClick={onClose} />

      {/* Drawer */}
      <div
        ref={menuRef}
        className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 animate-slideDown"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <img src="/logo.png" alt="TinyFix" className="h-7" />
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-50 text-gray-500 focus-ring"
            aria-label="Close menu"
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-atoll-50 text-atoll-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={20} />
              <span className="flex-1">{label}</span>
              {label === 'Service Requests' && pendingCount > 0 && (
                <span className="bg-atoll-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 pt-2 border-t border-gray-100 mt-1">
          <button
            onClick={() => { logout(); onClose() }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <MdLogout size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
