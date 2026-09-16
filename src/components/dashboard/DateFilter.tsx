import { useEffect, useId, useRef, useState } from 'react'

const OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year'] as const

export function DateFilter() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<(typeof OPTIONS)[number]>('Last 30 days')
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 min-h-[40px] shrink-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[13px] font-medium text-navy transition hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/15"
      >
        {value}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M3 4.5L6 7.5L9 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Date range"
          className="absolute right-0 z-30 mt-1 max-h-[min(16rem,70dvh)] min-w-full overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {OPTIONS.map((option) => (
            <li key={option} role="option" aria-selected={option === value}>
              <button
                type="button"
                className={[
                  'block min-h-[40px] w-full px-3 py-2.5 text-left text-[13px] transition hover:bg-page',
                  option === value ? 'font-semibold text-navy' : 'text-navy/80',
                ].join(' ')}
                onClick={() => {
                  setValue(option)
                  setOpen(false)
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
