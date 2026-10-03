import { useCallback, useEffect, useId, useRef, useState } from 'react'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const buttonStyles = {
  primary: 'bg-accent text-on-accent font-semibold hover:bg-accent-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-bg',
  danger: 'bg-bad text-white hover:opacity-90',
  ghost: 'text-ink hover:bg-bg',
}

export function Button({ variant = 'primary', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export function TextField({ label, error, hint, as = 'input', className = '', id, right, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  const Tag = as
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <Tag
          id={fieldId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={`block w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted ${focusRing} ${right ? 'pr-16' : ''} ${
            error ? 'border-bad' : 'border-line hover:border-muted'
          }`}
          {...props}
        />
        {right}
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-bad">{error}</p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export function PasswordField(props) {
  const [shown, setShown] = useState(false)
  return (
    <TextField
      {...props}
      type={shown ? 'text' : 'password'}
      right={
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-pressed={shown}
          className={`absolute inset-y-0 right-0 rounded-md px-3 text-sm font-medium text-muted hover:text-ink ${focusRing}`}
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      }
    />
  )
}

const bannerStyles = {
  error: 'border-bad/40 bg-bad-bg text-bad',
  info: 'border-line bg-surface text-ink',
  success: 'border-ok/40 bg-ok-bg text-ok',
}

export function Banner({ kind = 'info', children, action }) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm ${bannerStyles[kind]}`}
    >
      <span>{children}</span>
      {action}
    </div>
  )
}

export function Spinner({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  )
}

// Shows true once `active` has stayed true for `ms` (used for the "server is waking up" note).
export function useSlowNotice(active, ms = 5000) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!active) { setSlow(false); return undefined }
    const t = setTimeout(() => setSlow(true), ms)
    return () => clearTimeout(t)
  }, [active, ms])
  return slow
}

export const WAKING_UP = 'The server is waking up, this can take a minute.'

// ---- toasts ----
export function useToasts() {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)
  const push = useCallback((message, kind = 'success') => {
    const id = nextId.current++
    setToasts((list) => [...list, { id, message, kind }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4000)
  }, [])
  return { toasts, push }
}

export function ToastStack({ toasts }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-md px-4 py-2.5 text-sm font-medium shadow-lg ${
            t.kind === 'error' ? 'bg-bad text-white' : 'bg-panel text-panel-ink'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ---- modal dialog: Escape closes, focus stays inside, background click closes ----
export function Modal({ title, onClose, children }) {
  const titleId = useId()
  const panel = useRef(null)

  useEffect(() => {
    const previous = document.activeElement
    const focusables = () =>
      panel.current
        ? panel.current.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])')
        : []
    const first = focusables()[0]
    if (first && !panel.current.contains(document.activeElement)) first.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key === 'Tab') {
        const items = Array.from(focusables())
        if (items.length === 0) return
        const head = items[0]
        const tail = items[items.length - 1]
        if (e.shiftKey && document.activeElement === head) { e.preventDefault(); tail.focus() }
        else if (!e.shiftKey && document.activeElement === tail) { e.preventDefault(); head.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      if (previous && previous.focus) previous.focus()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-panel/70 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-full w-full overflow-y-auto rounded-t-xl border border-line bg-surface p-6 shadow-xl sm:max-w-lg sm:rounded-xl"
      >
        <h2 id={titleId} className="font-heading mb-4 text-xl">{title}</h2>
        {children}
      </div>
    </div>
  )
}
