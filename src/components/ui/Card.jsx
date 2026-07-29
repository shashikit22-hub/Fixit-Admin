export default function Card({ title, icon: Icon, actions, className = '', children, ...props }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`} {...props}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="text-gray-400" />}
            <h3 className="text-sm font-semibold text-gray-500 uppercase">{title}</h3>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}
