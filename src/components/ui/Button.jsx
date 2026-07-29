import { forwardRef } from 'react'

const variants = {
  primary: 'bg-atoll-600 text-white hover:bg-atoll-700 active:bg-atoll-800',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
  outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100',
  ghost: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-md gap-2',
  lg: 'px-5 py-2.5 text-base rounded-lg gap-2',
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
})

export default Button
