import { forwardRef } from 'react'

const Select = forwardRef(function Select(
  { label, error, helperText, children, className = '', wrapperClass = '', ...props },
  ref
) {
  const hasError = !!error
  return (
    <div className={wrapperClass}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <select
        ref={ref}
        className={`w-full border rounded-lg px-3 py-2 outline-none transition-all text-sm focus-ring appearance-none bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-9 ${
          hasError
            ? 'border-red-400 bg-red-50/50 focus:border-red-500'
            : 'border-gray-300 hover:border-atoll-300 focus:border-atoll-500'
        } ${className}`}
        aria-invalid={hasError || undefined}
        {...props}
      >
        {children}
      </select>
      {hasError && (
        <p className="mt-1.5 text-xs text-red-500" role="alert">{error}</p>
      )}
      {helperText && !hasError && (
        <p className="mt-1.5 text-xs text-gray-400">{helperText}</p>
      )}
    </div>
  )
})

export default Select
