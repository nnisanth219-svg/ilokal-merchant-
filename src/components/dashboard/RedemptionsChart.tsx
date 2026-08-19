import { useDashboardChart } from '../../hooks/useDashboardData'
import type { DashboardChartPoint } from '../../types/dashboard'

const toneClass: Record<DashboardChartPoint['tone'], string> = {
  blue: 'bg-chart-blue',
  navy: 'bg-navy',
  red: 'bg-action',
}

export function RedemptionsChart() {
  const { data, loading, error } = useDashboardChart()
  const points = data?.points ?? []
  const maxValue = Math.max(...points.map((point) => point.value), 1)

  return (
    <section className="flex h-full min-h-[320px] flex-col rounded-xl border border-border bg-white p-5">
      <div className="mb-5 flex shrink-0 items-start justify-between gap-3">
        <h2 className="text-[16px] font-bold text-navy">Redemptions & sign-ups</h2>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {data?.rangeLabel ?? 'DAILY · 30D'}
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[220px] flex-1 items-end gap-2.5 px-1 pb-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="w-full animate-pulse rounded-t-md bg-page"
              style={{ height: `${30 + ((index * 17) % 50)}%` }}
            />
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <div className="flex min-h-[220px] flex-1 items-center justify-center rounded-lg bg-page px-4 text-center text-[13px] text-coral">
          Unable to load chart data
        </div>
      ) : null}

      {!loading && !error && points.length === 0 ? (
        <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-page px-4 text-center">
          <p className="text-[14px] font-medium text-navy">No redemption chart data yet</p>
          <p className="max-w-md text-[12px] leading-relaxed text-muted">
            {data?.message ??
              'Redemptions data is unavailable until the related PostgreSQL tables exist.'}
          </p>
        </div>
      ) : null}

      {!loading && !error && points.length > 0 ? (
        <div
          className="flex min-h-[220px] flex-1 items-end gap-2.5 px-1 pb-2"
          role="img"
          aria-label="Bar chart of redemptions and sign-ups"
        >
          {points.map((bar) => (
            <div
              key={bar.label}
              className={`w-full min-w-0 rounded-t-md ${toneClass[bar.tone]}`}
              style={{ height: `${Math.max((bar.value / maxValue) * 100, 4)}%` }}
              title={`${bar.label}: ${bar.value}`}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
        <LegendSwatch className="bg-chart-blue" label="Redemptions" />
        <LegendSwatch className="bg-action" label="Peak day" />
        <LegendSwatch className="bg-navy" label="New members" />
      </div>
    </section>
  )
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${className}`} aria-hidden="true" />
      {label}
    </span>
  )
}
