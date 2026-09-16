import { Link } from 'react-router-dom'
import { useDashboardActivity } from '../../hooks/useDashboardData'
import type { AttentionTone } from '../../types/dashboard'

const toneStyles: Record<AttentionTone, { row: string; dot: string }> = {
  red: {
    row: 'bg-[#FCEEEE] hover:bg-[#F8E3E3]',
    dot: 'bg-action',
  },
  yellow: {
    row: 'bg-[#FBF4DF] hover:bg-[#F7EDCB]',
    dot: 'bg-gold',
  },
  blue: {
    row: 'bg-[#EEF2F7] hover:bg-[#E4EAF2]',
    dot: 'bg-navy',
  },
}

export function AttentionPanel() {
  const { data, loading, error } = useDashboardActivity()
  const items = data ?? []

  return (
    <section className="flex min-h-[280px] flex-col rounded-xl border border-border bg-white p-5 lg:h-full lg:min-h-[320px]">
      <h2 className="mb-4 shrink-0 text-[16px] font-bold text-navy">Needs your attention</h2>

      {loading ? (
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={`attention-skeleton-${index}`} className="h-[52px] animate-pulse rounded-lg bg-page" />
          ))}
        </ul>
      ) : null}

      {!loading && error ? (
        <div className="flex flex-1 items-center justify-center rounded-lg bg-page px-3 text-center text-[13px] text-coral">
          Unable to load recent activity
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg bg-page px-3 text-center text-[13px] text-muted">
          No attention items right now
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {items.map((item) => {
            const tone = item.tone ?? 'blue'
            const styles = toneStyles[tone]
            const content = (
              <>
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
                  aria-hidden="true"
                />
                <p className="text-[13px] leading-[1.45] text-navy">
                  {item.boldPrefix ? (
                    <>
                      <span className="font-bold">{item.boldPrefix}</span>
                      {item.rest ?? ''}
                    </>
                  ) : (
                    <>
                      <span className="font-bold">{item.title}</span>
                      {item.description ? ` — ${item.description}` : ''}
                    </>
                  )}
                </p>
              </>
            )

            return (
              <li key={item.id} className="shrink-0">
                {item.href ? (
                  <Link
                    to={item.href}
                    className={[
                      'flex min-h-[52px] w-full cursor-pointer items-start gap-2.5 rounded-lg px-3 py-3 transition',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20',
                      styles.row,
                    ].join(' ')}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={`flex min-h-[52px] w-full items-start gap-2.5 rounded-lg px-3 py-3 ${styles.row}`}>
                    {content}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
