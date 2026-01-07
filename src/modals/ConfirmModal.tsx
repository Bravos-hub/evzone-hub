import type { PropsWithChildren } from 'react'

type ConfirmModalProps = PropsWithChildren<{
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}>

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
  loading = false,
  children,
}: ConfirmModalProps) {
  if (!open) return null

  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    info: 'bg-accent hover:bg-accent/90',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-panel border border-border-light rounded-xl p-6 shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
        {message && <p className="text-sm text-muted mb-4">{message}</p>}
        {children}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            className="btn secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn text-white ${variantClasses[variant]}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

