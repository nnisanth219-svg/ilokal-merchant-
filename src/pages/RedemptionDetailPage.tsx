import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RedemptionStatusBadge } from '../components/redemptions/RedemptionStatusBadge'
import { formatDateTime } from '../components/cms/AdminListPrimitives'
import { getRedemptionApi } from '../services/redemptionApi'
import type { Redemption } from '../types/redemption'

export function RedemptionDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<Redemption | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getRedemptionApi(id)
      .then((data) => {
        if (!cancelled) setItem(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setItem(null)
          setError(err instanceof Error ? err.message : 'Unable to load redemption')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-[13px] text-muted">Loading redemption…</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[20px] font-bold text-navy">Redemption not found</h1>
          {error ? <p className="mt-2 text-[13px] text-action">{error}</p> : null}
          <Link
            to="/redemptions"
            className="mt-3 inline-block text-[13px] font-semibold text-navy underline"
          >
            Back to redemptions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 bg-navy px-4 py-5 text-white sm:px-6 sm:py-6">
        <p className="text-[12px] text-white/65">
          <Link to="/redemptions" className="hover:text-white">
            Redemptions
          </Link>
          <span className="mx-1.5 text-white/40">/</span>
          <span className="text-gold">{item.redemptionCode}</span>
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
                {item.redemptionCode}
              </h1>
              <span className="inline-flex items-center rounded-full bg-white/10 px-1 py-0.5">
                <RedemptionStatusBadge status={item.status} />
              </span>
            </div>
            <p className="mt-1 break-words text-[13px] text-white/70">
              {item.memberName} · {item.merchantName}
            </p>
            <p className="mt-1 text-[13px] text-white/55">
              {item.offerTitle} · {formatDateTime(item.redeemedAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/redemptions')}
              className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => navigate(`/members/${item.memberId}`)}
              className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
            >
              View member
            </button>
            <button
              type="button"
              onClick={() => navigate(`/merchants/${item.merchantId}`)}
              className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
            >
              View merchant
            </button>
            <button
              type="button"
              onClick={() => navigate(`/offers/${item.offerId}`)}
              className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
            >
              View offer
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Redemption ID" value={item.redemptionCode} />
          <StatCard
            label="Status"
            value={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          />
          <StatCard label="Date & time" value={formatDateTime(item.redeemedAt)} />
          <StatCard label="Method" value={item.method} />
          <StatCard label="Verification" value={item.verificationStatus} />
          <StatCard label="Member" value={item.memberName} />
          <StatCard label="Merchant" value={item.merchantName} />
          <StatCard label="Offer" value={item.offerTitle} />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <InfoCard title="Offer" subtitle="Redeemed offer details">
            <Field label="Offer title" value={item.offerTitle} />
            <Field label="Offer ID" value={item.offerId} />
            <button
              type="button"
              onClick={() => navigate(`/offers/${item.offerId}`)}
              className="mt-3 inline-flex h-9 items-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page"
            >
              Open offer
            </button>
          </InfoCard>

          <InfoCard title="Member" subtitle="Who redeemed">
            <Field label="Name" value={item.memberName} />
            <Field label="Member ID" value={item.memberId} />
            <button
              type="button"
              onClick={() => navigate(`/members/${item.memberId}`)}
              className="mt-3 inline-flex h-9 items-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page"
            >
              Open member
            </button>
          </InfoCard>

          <InfoCard title="Merchant" subtitle="Where it was redeemed">
            <Field label="Name" value={item.merchantName} />
            <Field label="Merchant ID" value={item.merchantId} />
            <button
              type="button"
              onClick={() => navigate(`/merchants/${item.merchantId}`)}
              className="mt-3 inline-flex h-9 items-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page"
            >
              Open merchant
            </button>
          </InfoCard>
        </div>

        <section className="mt-4 rounded-xl border border-border bg-white p-5">
          <h2 className="text-[15px] font-bold text-navy">Activity</h2>
          <p className="mt-0.5 text-[12px] text-muted">Timeline for this redemption</p>
          {item.activity.length === 0 ? (
            <p className="mt-8 text-center text-[13px] text-muted">No activity recorded.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {item.activity.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-border px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-[13px] text-navy">{entry.description}</p>
                    <span className="text-[12px] text-muted">{entry.dateLabel}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 break-words text-[18px] font-bold tracking-[-0.02em] text-navy">{value}</p>
    </article>
  )
}

function InfoCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold text-navy">{title}</h2>
      <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-page px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-1 break-words text-[14px] font-semibold text-navy">{value}</p>
    </div>
  )
}
