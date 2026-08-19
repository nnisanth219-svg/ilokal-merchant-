import { Link } from 'react-router-dom'

interface MetricCardProps {
  label: string
  value: string
  trend?: string | null
  variant?: 'default' | 'highlight'
  secondary?: string | null
  to?: string
  loading?: boolean
}

export function MetricCard({
  label,
  value,
  trend,
  variant = 'default',
  secondary,
  to,
  loading = false,
}: MetricCardProps) {
  const isHighlight = variant === 'highlight'

  const content = (
    <>
      <p
        className={[
          'text-[11px] font-semibold uppercase tracking-[0.12em]',
          isHighlight ? 'text-gold' : 'text-muted',
        ].join(' ')}
      >
        {label}
      </p>
      {loading ? (
        <div
          className={[
            'mt-3 h-8 w-28 animate-pulse rounded-md',
            isHighlight ? 'bg-white/15' : 'bg-page',
          ].join(' ')}
        />
      ) : (
        <p
          className={[
            'mt-3 text-[30px] font-bold leading-none tracking-[-0.02em]',
            isHighlight ? 'text-white' : 'text-navy',
          ].join(' ')}
        >
          {value}
        </p>
      )}
      {!loading && trend ? (
        <p className="mt-3 text-[13px] font-medium text-success">
          <span aria-hidden="true">▲ </span>
          {trend}
        </p>
      ) : null}
      {!loading && secondary ? (
        <p className={['mt-3 text-[13px]', isHighlight ? 'text-[#9EB0C7]' : 'text-muted'].join(' ')}>
          {secondary}
        </p>
      ) : null}
      {loading ? (
        <div
          className={[
            'mt-3 h-4 w-36 animate-pulse rounded-md',
            isHighlight ? 'bg-white/10' : 'bg-page',
          ].join(' ')}
        />
      ) : null}
    </>
  )

  const className = [
    'rounded-xl px-5 py-5 transition',
    isHighlight ? 'bg-navy' : 'border border-border bg-white',
    to
      ? 'block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(16,43,89,0.08)]'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link to={to} className={className} aria-label={`Open ${label}`}>
        {content}
      </Link>
    )
  }

  return <article className={className}>{content}</article>
}
