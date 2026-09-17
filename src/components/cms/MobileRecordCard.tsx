import type { ReactNode } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export function MobileRecordList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 md:hidden">{children}</div>
}

export function MobileRecordCard({
  selected = false,
  muted = false,
  children,
}: {
  selected?: boolean
  muted?: boolean
  children: ReactNode
}) {
  return (
    <article
      className={[
        'rounded-xl border bg-white p-3.5',
        selected ? 'border-navy/35 bg-[#F7F9FC]' : 'border-border',
        muted ? 'opacity-70' : '',
      ].join(' ')}
    >
      {children}
    </article>
  )
}

export function MobileRecordTop({
  select,
  title,
  subtitle,
  badge,
  action,
}: {
  select?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      {select ? <div className="shrink-0 pt-0.5">{select}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-[15px] font-semibold leading-snug text-navy">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-0.5 break-words text-[13px] leading-snug text-muted">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-start gap-1">
            {badge}
            {action}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileRecordFields({ children }: { children: ReactNode }) {
  return <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">{children}</dl>
}

export function MobileRecordField({
  label,
  value,
  wide = false,
}: {
  label: string
  value: ReactNode
  wide?: boolean
}) {
  return (
    <div className={wide ? 'col-span-2 min-w-0' : 'min-w-0'}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-[13px] font-medium leading-snug text-navy">
        {value === null || value === undefined || value === '' ? '—' : value}
      </dd>
    </div>
  )
}

export function MobileSelect({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="inline-flex h-10 w-10 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="h-4 w-4 accent-navy"
      />
    </label>
  )
}

export function DesktopTableFrame({
  children,
  footer,
}: {
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white md:flex">
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      {footer}
    </div>
  )
}

export function MobileEmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-border bg-white px-4 py-12 text-center text-[13px] text-muted md:hidden">
      {children}
    </p>
  )
}

export function MobilePagerFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border md:hidden">{children}</div>
  )
}

export function ResponsiveRecordLayout({
  loading,
  itemCount,
  emptyLabel,
  mobileCards,
  table,
  renderPager,
}: {
  loading: boolean
  itemCount: number
  emptyLabel: string
  mobileCards: ReactNode
  table: ReactNode
  renderPager: (className?: string) => ReactNode
}) {
  if (loading && itemCount === 0) {
    return <LoadingSpinner />
  }

  return (
    <>
      {itemCount === 0 ? <MobileEmptyState>{emptyLabel}</MobileEmptyState> : mobileCards}
      <MobilePagerFrame>{renderPager()}</MobilePagerFrame>
      <DesktopTableFrame footer={renderPager('border-t border-border')}>{table}</DesktopTableFrame>
    </>
  )
}
