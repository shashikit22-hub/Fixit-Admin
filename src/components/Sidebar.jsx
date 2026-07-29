import { NavLink, useNavigate } from 'react-router-dom'
import { MdDashboard, MdBuild, MdPeople, MdLogout } from 'react-icons/md'

const links = [
  { to: '/', icon: MdDashboard, label: 'Dashboard' },
  { to: '/requests', icon: MdBuild, label: 'Service Requests' },
  { to: '/technicians', icon: MdPeople, label: 'Technicians' },
]

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('fixit_token')
    localStorage.removeItem('fixit_user')
    navigate('/login')
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-50 transform transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-cyan-400">FIXIT Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white w-full transition-colors"
          >
            <MdLogout size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
