export function LoadingSpinner({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={[
        'flex items-center justify-center',
        compact ? 'min-h-[8rem] py-6' : 'min-h-[12rem] flex-1 py-10',
        className ?? '',
      ].join(' ')}
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <svg
        className={compact ? 'h-6 w-6 animate-spin text-navy' : 'h-8 w-8 animate-spin text-navy'}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="3"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">Loading</span>
    </div>
  )
}
