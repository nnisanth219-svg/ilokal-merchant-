import type { ReactNode } from 'react'

export function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-[26px] font-bold tracking-[-0.02em] text-navy">{value}</p>
    </article>
  )
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
      {children}
    </th>
  )
}

export function FilterPill({
  label,
  value,
  displayValue,
  options,
  onChange,
}: {
  label: string
  value: string
  displayValue?: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="relative inline-flex h-10 min-h-[40px] max-w-full items-center gap-1.5 rounded-lg border border-border bg-white pl-3 pr-2 text-[13px] text-navy">
      <span className="font-medium text-muted">{label}</span>
      <span className="max-w-[9.5rem] truncate font-semibold sm:max-w-none">{displayValue ?? value}</span>
      <ChevronDown />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function PagerButton({
  label,
  onClick,
  disabled,
  active,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex h-10 min-h-[40px] min-w-10 items-center justify-center rounded-md px-2.5 text-[12px] font-semibold transition',
        active
          ? 'bg-navy text-white'
          : 'border border-border bg-white text-navy hover:bg-page disabled:cursor-not-allowed disabled:opacity-40',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

/** Matches Merchants / Members bulk toolbar secondary actions. */
export function BulkBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 min-h-[40px] items-center rounded-md border border-white/25 bg-white/10 px-3 text-[12px] font-semibold text-white hover:bg-white/15"
    >
      {label}
    </button>
  )
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function pageWindow(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 4) return Array.from({ length: totalPages }, (_, i) => i + 1)
  if (currentPage <= 2) return [1, 2, 3, 4]
  if (currentPage >= totalPages - 1) {
    return [totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
}

export const CMS_PAGE_SIZE = 25
