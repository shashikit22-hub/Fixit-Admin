import { Link } from 'react-router-dom'
import { MdChevronRight } from 'react-icons/md'

export default function PageHeader({ title, subtitle, breadcrumbs, actions, children }) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <MdChevronRight size={16} className="text-gray-400" />}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-atoll-600 transition-colors">{crumb.label}</Link>
              ) : (
                <span className="text-gray-700 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
