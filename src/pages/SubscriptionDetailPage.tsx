import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { SubscriptionStatusBadge } from '../components/subscriptions/SubscriptionStatusBadge'
import { formatDate, Th } from '../components/cms/AdminListPrimitives'
import {
  getSubscriptionById,
  setSubscriptionStatus,
  subscribeSubscriptions,
} from '../services/subscriptionStore'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function SubscriptionDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(() => getSubscriptionById(id))
  const [confirm, setConfirm] = useState<'suspend' | 'cancel' | null>(null)

  useEffect(() => {
    setItem(getSubscriptionById(id))
    return subscribeSubscriptions(() => setItem(getSubscriptionById(id)))
  }, [id])

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[20px] font-bold text-navy">Subscription not found</h1>
          <Link
            to="/subscriptions"
            className="mt-3 inline-block text-[13px] font-semibold text-navy underline"
          >
            Back to subscriptions
          </Link>
        </div>
      </div>
    )
  }

  const isSuspended = item.status === 'suspended'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 bg-navy px-4 py-5 text-white sm:px-6 sm:py-6">
        <p className="text-[12px] text-white/65">
          <Link to="/subscriptions" className="hover:text-white">
            Subscriptions
          </Link>
          <span className="mx-1.5 text-white/40">/</span>
          <span className="text-gold">{item.subscriptionCode}</span>
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[16px] font-bold text-gold sm:h-16 sm:w-16 sm:text-[18px]">
              {initials(item.memberName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
                  {item.memberName}
                </h1>
                <span className="inline-flex items-center rounded-full bg-white/10 px-1 py-0.5">
                  <SubscriptionStatusBadge status={item.status} />
                </span>
              </div>
              <p className="mt-1 break-words text-[13px] text-white/70">
                {item.memberEmail} · {item.memberPhone}
              </p>
              <p className="mt-1 text-[13px] text-white/55">
                {item.plan} · {item.billing} billing · ID {item.subscriptionCode}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/subscriptions')}
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
              onClick={() => {
                if (isSuspended) {
                  setSubscriptionStatus(item.id, 'active')
                } else {
                  setConfirm('suspend')
                }
              }}
              className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
            >
              {isSuspended ? 'Resume' : 'Suspend'}
            </button>
            <button
              type="button"
              onClick={() => setConfirm('cancel')}
              className="inline-flex h-9 min-h-[36px] w-full items-center justify-center rounded-lg bg-action px-3.5 text-[13px] font-semibold text-white hover:bg-[#c82027] sm:w-auto"
            >
              Cancel subscription
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid gap-4 xl:grid-cols-2">
          <InfoCard title="Subscription overview" subtitle="Plan, billing and validity">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label="Plan" value={item.plan} />
              <Field label="Billing" value={item.billing} />
              <Field label="Start date" value={formatDate(item.startDate)} />
              <Field label="Expiry date" value={formatDate(item.expiryDate)} />
              <Field
                label="Status"
                value={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              />
              <Field label="Subscription ID" value={item.subscriptionCode} />
            </dl>
          </InfoCard>

          <InfoCard title="Member information" subtitle="Linked member profile">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" value={item.memberName} />
              <Field label="Member ID" value={item.memberCode} />
              <Field label="Email" value={item.memberEmail} />
              <Field label="Phone" value={item.memberPhone} />
            </dl>
            <button
              type="button"
              onClick={() => navigate(`/members/${item.memberId}`)}
              className="mt-4 inline-flex h-9 items-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page"
            >
              Open member profile
            </button>
          </InfoCard>
        </div>

        <section className="mt-4 overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-[15px] font-bold text-navy">Payment history</h2>
            <p className="mt-0.5 text-[12px] text-muted">Charges linked to this subscription</p>
          </div>
          {item.payments.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-muted">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-[#FAF9F6]">
                    <Th>Date</Th>
                    <Th>Reference</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {item.payments.map((pay) => (
                    <tr key={pay.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3.5 text-[13px] text-navy">
                        {formatDate(pay.paidAt)}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium tabular-nums text-navy">
                        {pay.reference}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] tabular-nums text-navy">
                        {pay.amountLabel}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                            pay.status === 'Paid'
                              ? 'bg-[#E8F6F0] text-success'
                              : pay.status === 'Failed'
                                ? 'bg-[#FDECEC] text-action'
                                : 'bg-[#FFF4D6] text-[#A67A00]',
                          ].join(' ')}
                        >
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirm === 'suspend'}
        title="Suspend subscription?"
        message={`Suspend the subscription for ${item.memberName}? Benefits will pause until resumed.`}
        confirmLabel="Suspend"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setSubscriptionStatus(item.id, 'suspended')
          setConfirm(null)
        }}
      />
      <ConfirmDialog
        open={confirm === 'cancel'}
        title="Cancel subscription?"
        message={`Cancel the subscription for ${item.memberName}? This will mark it as suspended.`}
        confirmLabel="Cancel subscription"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setSubscriptionStatus(item.id, 'suspended')
          setConfirm(null)
        }}
      />
    </div>
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
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-page px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</dt>
      <dd className="mt-1 break-words text-[14px] font-semibold text-navy">{value}</dd>
    </div>
  )
}
