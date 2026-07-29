export default function Badge({ children, className = 'bg-gray-100 text-gray-700', dot, ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {children}
    </span>
  )
}
