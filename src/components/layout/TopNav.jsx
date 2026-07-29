import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { MdDashboard, MdBuild, MdPeople, MdMenu, MdLogout, MdKeyboardArrowDown } from 'react-icons/md'
import useAuth from '../../hooks/useAuth'
import api from '../../services/api'
import MobileMenu from './MobileMenu'

const links = [
  { to: '/', icon: MdDashboard, label: 'Dashboard', end: true },
  { to: '/requests', icon: MdBuild, label: 'Service Requests' },
  { to: '/technicians', icon: MdPeople, label: 'Technicians' },
]

export default function TopNav() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    api.get('/dashboard')
      .then(res => {
        const d = res.data
        setPendingCount((d.newCount || 0) + (d.assignedCount || 0) + (d.inProgressCount || 0))
      })
      .catch(() => {})
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = () => setUserMenuOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [userMenuOpen])

  const displayName = user.fullName || user.username || 'Admin'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200" role="navigation" aria-label="Main navigation">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">

            {/* Left: hamburger (mobile) + logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors focus-ring"
                aria-label="Open menu"
              >
                <MdMenu size={24} />
              </button>
              <NavLink to="/" className="flex items-center shrink-0">
                <img
                  src="/logo.png"
                  alt="TinyFix Admin"
                  className="h-14 sm:h-16 w-auto object-contain"
                />
              </NavLink>
            </div>

            {/* Center: desktop nav links */}
            <div className="hidden lg:flex items-center h-full">
              {links.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 px-5 h-full text-[13px] font-semibold tracking-wide uppercase transition-colors ${
                      isActive
                        ? 'text-atoll-700'
                        : 'text-gray-500 hover:text-gray-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} className={isActive ? 'text-atoll-600' : ''} />
                      <span>{label}</span>
                      {label === 'Service Requests' && pendingCount > 0 && (
                        <span className="ml-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 leading-none">
                          {pendingCount}
                        </span>
                      )}
                      {/* Active bottom border */}
                      {isActive && (
                        <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-atoll-600 rounded-t-full" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Right: user dropdown */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setUserMenuOpen(v => !v) }}
                className={`flex items-center gap-2 py-1.5 px-2.5 -mr-2 rounded-lg transition-colors focus-ring ${
                  userMenuOpen ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                <div className="w-9 h-9 rounded-full bg-atoll-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                  <p className="text-[11px] text-gray-400">{user.role || 'Administrator'}</p>
                </div>
                <MdKeyboardArrowDown
                  size={18}
                  className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-lg border border-gray-200 py-1 animate-scaleIn origin-top-right z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                    <p className="text-xs text-gray-400">{user.role || 'Administrator'}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={logout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
                    >
                      <MdLogout size={18} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={links}
        pendingCount={pendingCount}
      />
    </>
  )
}
