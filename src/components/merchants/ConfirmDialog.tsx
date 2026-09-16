interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="max-h-[min(90dvh,36rem)] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-white p-6 shadow-[0_20px_40px_rgba(16,43,89,0.16)]"
      >
        <h2 id="confirm-dialog-title" className="text-[18px] font-bold text-navy">
          {title}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg border border-border bg-white px-4 text-[13px] font-semibold text-navy hover:bg-page"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              'inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg px-4 text-[13px] font-semibold text-white',
              destructive ? 'bg-action hover:bg-[#c82027]' : 'bg-navy hover:bg-navy-secondary',
            ].join(' ')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
