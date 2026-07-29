import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, helperText, icon: Icon, className = '', wrapperClass = '', ...props },
  ref
) {
  const hasError = !!error
  return (
    <div className={wrapperClass}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        )}
        <input
          ref={ref}
          className={`w-full border rounded-lg outline-none transition-all text-sm focus-ring ${
            Icon ? 'pl-10 pr-4' : 'px-3'
          } py-2 ${
            hasError
              ? 'border-red-400 bg-red-50/50 focus:border-red-500'
              : 'border-gray-300 hover:border-atoll-300 focus:border-atoll-500'
          } ${className}`}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${props.id || props.name}-error` : undefined}
          {...props}
        />
      </div>
      {hasError && (
        <p id={`${props.id || props.name}-error`} className="mt-1.5 text-xs text-red-500" role="alert">{error}</p>
      )}
      {helperText && !hasError && (
        <p className="mt-1.5 text-xs text-gray-400">{helperText}</p>
      )}
    </div>
  )
})

export default Input
