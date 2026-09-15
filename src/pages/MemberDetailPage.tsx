import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { MemberStatusBadge } from '../components/members/MemberStatusBadge'
import { useAuth } from '../context/AuthContext'
import {
  getMemberApi,
  restoreMemberApi,
  softDeleteMemberApi,
  updateMemberStatusApi,
} from '../services/memberApi'
import { canDeleteInModule, canEditInModule } from '../types/auth'
import type { Member } from '../types/member'

type DetailTab =
  | 'overview'
  | 'purchases'
  | 'redemptions'
  | 'reviews'
  | 'device'
  | 'support'

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function stars(rating: number): string {
  const safe = Math.max(0, Math.min(5, rating))
  return `${'★'.repeat(safe)}${'☆'.repeat(5 - safe)}`
}

export function MemberDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = canEditInModule(user, 'Members')
  const canDelete = canDeleteInModule(user, 'Members')
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<DetailTab>('overview')
  const [confirm, setConfirm] = useState<'deactivate' | 'delete' | 'restore' | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setTab('overview')
    getMemberApi(id, true)
      .then((data) => {
        if (!cancelled) setMember(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setMember(null)
          setError(err instanceof Error ? err.message : 'Unable to load member')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function reload(): Promise<void> {
    const data = await getMemberApi(id, true)
    setMember(data)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-[13px] text-muted">Loading member…</p>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[20px] font-bold text-navy">Member not found</h1>
          {error ? <p className="mt-2 text-[13px] text-action">{error}</p> : null}
          <Link to="/members" className="mt-3 inline-block text-[13px] font-semibold text-navy underline">
            Back to members
          </Link>
        </div>
      </div>
    )
  }

  const isDeleted = member.status === 'deleted'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 bg-navy px-4 py-5 text-white sm:px-6 sm:py-6">
        <p className="text-[12px] text-white/65">
          <Link to="/members" className="hover:text-white">
            Members
          </Link>
          <span className="mx-1.5 text-white/40">/</span>
          <span className="text-gold">{member.memberCode}</span>
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[16px] font-bold text-gold sm:h-16 sm:w-16 sm:text-[18px]">
              {initials(member.fullName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
                  {member.fullName}
                </h1>
                <span className="inline-flex items-center rounded-full bg-white/10 px-1 py-0.5">
                  <MemberStatusBadge status={member.status} />
                </span>
              </div>
              <p className="mt-1 break-words text-[13px] text-white/70">
                {member.email} · {member.phone}
              </p>
              <p className="mt-1 text-[13px] text-white/55">
                {member.planLabel} · Joined {formatDate(member.joinedAt)}
                {member.expiresAt ? ` · Valid until ${formatDate(member.expiresAt)}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isDeleted ? (
              canDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirm('restore')}
                  className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
                >
                  Restore
                </button>
              ) : null
            ) : (
              <>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => setConfirm('deactivate')}
                    className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
                  >
                    Deactivate
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirm('delete')}
                    className="inline-flex h-9 min-h-[36px] w-full items-center justify-center rounded-lg bg-action px-3.5 text-[13px] font-semibold text-white hover:bg-[#c82027] sm:w-auto"
                  >
                    Delete
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="mt-5 flex gap-1 overflow-x-auto pb-0.5">
          <TabButton active={tab === 'overview'} label="Overview" onClick={() => setTab('overview')} />
          <TabButton
            active={tab === 'purchases'}
            label={`Purchases · ${member.purchases.length}`}
            onClick={() => setTab('purchases')}
          />
          <TabButton
            active={tab === 'redemptions'}
            label={`Redemptions · ${member.redemptions.length}`}
            onClick={() => setTab('redemptions')}
          />
          <TabButton
            active={tab === 'reviews'}
            label={`Reviews · ${member.reviews.length}`}
            onClick={() => setTab('reviews')}
          />
          <TabButton
            active={tab === 'device'}
            label="Device & subscription"
            onClick={() => setTab('device')}
          />
          <TabButton
            active={tab === 'support'}
            label="Support notes"
            onClick={() => setTab('support')}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        {error ? <p className="mb-3 text-[12px] text-action">{error}</p> : null}
        {tab === 'overview' ? <OverviewSection member={member} /> : null}
        {tab === 'purchases' ? <PurchasesSection member={member} /> : null}
        {tab === 'redemptions' ? <RedemptionsSection member={member} /> : null}
        {tab === 'reviews' ? <ReviewsSection member={member} /> : null}
        {tab === 'device' ? <DeviceSection member={member} /> : null}
        {tab === 'support' ? <SupportSection member={member} /> : null}
      </div>

      <ConfirmDialog
        open={confirm === 'deactivate'}
        title="Deactivate member?"
        message={`This member will no longer be able to use active membership benefits. Deactivate ${member.fullName}?`}
        confirmLabel="Deactivate"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          void (async () => {
            try {
              setError(null)
              await updateMemberStatusApi(member.id, 'inactive')
              await reload()
              setConfirm(null)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to deactivate member')
              setConfirm(null)
            }
          })()
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete member?"
        message={`This action will remove the member from the active member list. Delete ${member.fullName}?`}
        confirmLabel="Delete member"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          void (async () => {
            try {
              setError(null)
              await softDeleteMemberApi(member.id)
              setConfirm(null)
              navigate('/members')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to delete member')
              setConfirm(null)
            }
          })()
        }}
      />
      <ConfirmDialog
        open={confirm === 'restore'}
        title="Restore member?"
        message={`Restore ${member.fullName} to the member list? They will return as inactive.`}
        confirmLabel="Restore"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          void (async () => {
            try {
              setError(null)
              await restoreMemberApi(member.id)
              await reload()
              setConfirm(null)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to restore member')
              setConfirm(null)
            }
          })()
        }}
      />
    </div>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 whitespace-nowrap border-b-2 px-3 pb-2.5 text-[13px] font-semibold transition',
        active ? 'border-gold text-white' : 'border-transparent text-white/55 hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function OverviewSection({ member }: { member: Member }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Membership status"
        value={member.status.charAt(0).toUpperCase() + member.status.slice(1)}
      />
      <StatCard label="Current plan" value={member.planLabel} />
      <StatCard
        label="Membership validity"
        value={member.expiresAt ? formatDate(member.expiresAt) : '—'}
      />
      <StatCard label="Joined date" value={formatDate(member.joinedAt)} />
      <StatCard label="Total redemptions" value={String(member.totalRedemptions)} />
      <StatCard label="Total purchases" value={String(member.totalPurchases)} />
      <StatCard label="Reviews submitted" value={String(member.reviewsCount)} />
      <StatCard label="City" value={member.city} />
    </div>
  )
}

function PurchasesSection({ member }: { member: Member }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-[15px] font-bold text-navy">Purchases</h2>
        <p className="mt-0.5 text-[12px] text-muted">
          Membership and payment history (stub until Purchases module)
        </p>
      </div>
      {member.purchases.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-muted">No purchases yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-[#FAF9F6]">
                <Th>Date</Th>
                <Th>Description</Th>
                <Th>Plan / purchase</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {member.purchases.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3.5 text-[13px] text-navy">{formatDate(row.date)}</td>
                  <td className="px-4 py-3.5 text-[13px] font-medium text-navy">{row.description}</td>
                  <td className="px-4 py-3.5 text-[13px] text-navy">{row.plan}</td>
                  <td className="px-4 py-3.5 text-[13px] tabular-nums text-navy">{row.amountLabel}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={[
                        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                        row.status === 'Paid'
                          ? 'bg-[#E8F6F0] text-success'
                          : row.status === 'Failed'
                            ? 'bg-[#FDECEC] text-action'
                            : 'bg-[#FFF4D6] text-[#A67A00]',
                      ].join(' ')}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function RedemptionsSection({ member }: { member: Member }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-[15px] font-bold text-navy">Redemptions</h2>
        <p className="mt-0.5 text-[12px] text-muted">
          Offer redemption history (stub until Redemptions module)
        </p>
      </div>
      {member.redemptions.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-muted">No redemptions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-[#FAF9F6]">
                <Th>Date</Th>
                <Th>Merchant</Th>
                <Th>Offer</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {member.redemptions.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3.5 text-[13px] text-navy">{formatDate(row.date)}</td>
                  <td className="px-4 py-3.5 text-[13px] font-medium text-navy">{row.merchantName}</td>
                  <td className="px-4 py-3.5 text-[13px] text-navy">{row.offerTitle}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex rounded-full bg-[#E8F6F0] px-2.5 py-0.5 text-[11px] font-semibold text-success">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function ReviewsSection({ member }: { member: Member }) {
  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold text-navy">Reviews</h2>
      <p className="mt-0.5 text-[12px] text-muted">
        Reviews submitted by this member (stub until Reviews module)
      </p>
      {member.reviews.length === 0 ? (
        <p className="mt-8 text-center text-[13px] text-muted">No reviews yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {member.reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-border px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[14px] font-semibold text-navy">{review.merchantName}</p>
                  <p className="mt-0.5 text-[13px] text-gold">{stars(review.rating)}</p>
                  <p className="mt-2 text-[13px] text-navy">&ldquo;{review.text}&rdquo;</p>
                </div>
                <span className="text-[12px] text-muted">{formatDate(review.date)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DeviceSection({ member }: { member: Member }) {
  const rows = [
    { label: 'Plan', value: member.subscription.plan === 'None' ? '—' : member.subscription.plan },
    {
      label: 'Status',
      value:
        member.subscription.status.charAt(0).toUpperCase() + member.subscription.status.slice(1),
    },
    { label: 'Start date', value: member.subscription.startDate },
    { label: 'Valid until', value: member.subscription.validUntil },
    { label: 'Payment status', value: member.subscription.paymentStatus },
    { label: 'Device', value: member.device.device },
    { label: 'Platform', value: member.device.platform },
    { label: 'App version', value: member.device.appVersion },
    { label: 'Last active', value: formatDate(member.device.lastActive) },
  ]

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold text-navy">Device & subscription</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg border border-border bg-page px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              {row.label}
            </dt>
            <dd className="mt-1 text-[14px] font-semibold text-navy">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function SupportSection({ member }: { member: Member }) {
  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold text-navy">Support notes</h2>
      <p className="mt-0.5 text-[12px] text-muted">Internal notes for admin use</p>
      {member.supportNotes.length === 0 ? (
        <p className="mt-8 text-center text-[13px] text-muted">No support notes yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {member.supportNotes.map((note) => (
            <li key={note.id} className="rounded-lg border border-border px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-[13px] text-navy">{note.note}</p>
                <span className="text-[12px] text-muted">{formatDate(note.date)}</span>
              </div>
              <p className="mt-2 text-[12px] font-medium text-muted">Added by {note.addedBy}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 break-words text-[20px] font-bold tracking-[-0.02em] text-navy">{value}</p>
    </article>
  )
}

function Th({ children }: { children: string }) {
  return (
    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
      {children}
    </th>
  )
}
