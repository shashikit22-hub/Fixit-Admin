import { useEffect, useRef, useCallback } from 'react'
import { MdClose } from 'react-icons/md'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null)
  const dialogRef = useRef(null)
  const previousFocus = useRef(null)

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  }

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !dialogRef.current) return
    const focusable = dialogRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }, [onClose])

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement
      document.body.style.overflow = 'hidden'
      setTimeout(() => {
        const autofocus = dialogRef.current?.querySelector('[autofocus], input, select, textarea')
        if (autofocus) autofocus.focus()
        else dialogRef.current?.focus()
      }, 50)
    } else {
      document.body.style.overflow = ''
      previousFocus.current?.focus()
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`bg-white rounded-lg border border-gray-200 w-full ${sizeClasses[size]} animate-scaleIn outline-none`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus-ring"
              aria-label="Close dialog"
            >
              <MdClose size={20} />
            </button>
          </div>
        )}
        <div className={title ? '' : 'pt-0'}>{children}</div>
      </div>
    </div>
  )
}
