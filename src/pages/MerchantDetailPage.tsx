import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { MerchantStatusBadge } from '../components/merchants/MerchantStatusBadge'
import { useAuth } from '../context/AuthContext'
import {
  getMerchantApi,
  restoreMerchantApi,
  softDeleteMerchantApi,
  updateMerchantStatusApi,
} from '../services/merchantApi'
import {
  canCreateInModule,
  canDeleteInModule,
  canEditInModule,
} from '../types/auth'
import type { Merchant } from '../types/merchant'

type DetailTab =
  | 'overview'
  | 'offers'
  | 'redemptions'
  | 'reviews'
  | 'members'
  | 'activity'

export function MerchantDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = canEditInModule(user, 'Merchants')
  const canDelete = canDeleteInModule(user, 'Merchants')
  const canCreateOffer = canCreateInModule(user, 'Offers')
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<DetailTab>('overview')
  const [confirm, setConfirm] = useState<'deactivate' | 'delete' | null>(null)

  const loadMerchant = useCallback(async () => {
    if (!id) {
      setMerchant(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getMerchantApi(id, true)
      setMerchant(data)
    } catch (err) {
      setMerchant(null)
      setError(err instanceof Error ? err.message : 'Unable to load merchant')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadMerchant()
  }, [loadMerchant])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-[13px] text-muted">Loading merchant…</p>
      </div>
    )
  }

  if (!merchant) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[20px] font-bold text-navy">Merchant not found</h1>
          {error ? <p className="mt-2 text-[13px] text-muted">{error}</p> : null}
          <Link to="/merchants" className="mt-3 inline-block text-[13px] font-semibold text-navy underline">
            Back to merchants
          </Link>
        </div>
      </div>
    )
  }

  const isDeleted = merchant.status === 'deleted'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 bg-navy px-4 py-5 text-white sm:px-6 sm:py-6">
        <p className="text-[12px] text-white/65">
          <Link to="/merchants" className="hover:text-white">
            Merchants
          </Link>
          <span className="mx-1.5 text-white/40">/</span>
          <span className="text-gold">{merchant.merchantCode}</span>
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/10 text-[18px] font-bold text-gold sm:h-16 sm:w-16">
              {merchant.logoUrl ? (
                <img src={merchant.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                merchant.businessName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
                  {merchant.businessName}
                </h1>
                <span className="inline-flex items-center rounded-full bg-white/10 px-1 py-0.5">
                  <MerchantStatusBadge status={merchant.status} />
                </span>
                {merchant.featured ? (
                  <span className="inline-flex items-center rounded-full bg-gold/20 px-2.5 py-0.5 text-[11px] font-semibold text-gold">
                    Featured
                  </span>
                ) : null}
              </div>
              <p className="mt-1 break-words text-[13px] text-white/70">
                {merchant.category} ·{' '}
                {merchant.address || `${merchant.city}, ${merchant.state}`}
              </p>
              <p className="mt-1 text-[13px] font-medium text-white">
                ★ {merchant.rating.toFixed(1)}{' '}
                <span className="font-normal text-white/55">
                  ({merchant.ratingsCount.toLocaleString()} ratings)
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && !isDeleted ? (
              <Link
                to={`/merchants/${merchant.id}/edit`}
                className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
              >
                Edit
              </Link>
            ) : null}
            {isDeleted && canDelete ? (
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    try {
                      await restoreMerchantApi(merchant.id)
                      await loadMerchant()
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Unable to restore merchant')
                    }
                  })()
                }}
                className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
              >
                Restore
              </button>
            ) : null}
            {!isDeleted && canEdit ? (
              <button
                type="button"
                onClick={() => setConfirm('deactivate')}
                className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
              >
                Deactivate
              </button>
            ) : null}
            {!isDeleted && canDelete ? (
              <button
                type="button"
                onClick={() => setConfirm('delete')}
                className="inline-flex h-9 min-h-[36px] w-full items-center justify-center rounded-lg bg-action px-3.5 text-[13px] font-semibold text-white hover:bg-[#c82027] sm:w-auto"
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex gap-1 overflow-x-auto pb-0.5">
          <TabButton active={tab === 'overview'} label="Overview" onClick={() => setTab('overview')} />
          <TabButton
            active={tab === 'offers'}
            label={`Offers · ${merchant.offersCount}`}
            onClick={() => setTab('offers')}
          />
          <TabButton
            active={tab === 'redemptions'}
            label={`Redemptions · ${merchant.redeemedCount.toLocaleString()}`}
            onClick={() => setTab('redemptions')}
          />
          <TabButton
            active={tab === 'reviews'}
            label={`Reviews · ${merchant.ratingsCount}`}
            onClick={() => setTab('reviews')}
          />
          <TabButton
            active={tab === 'members'}
            label={`Members reached · ${merchant.membersReached}`}
            onClick={() => setTab('members')}
          />
          <TabButton
            active={tab === 'activity'}
            label="Activity log"
            onClick={() => setTab('activity')}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        {error ? <p className="mb-3 text-[12px] text-action">{error}</p> : null}
        {tab === 'overview' ? (
          <OverviewTab merchant={merchant} canCreateOffer={canCreateOffer} />
        ) : null}
        {tab === 'offers' ? (
          <PlaceholderTab
            title="Offers"
            body={`${merchant.offersCount} offer${merchant.offersCount === 1 ? '' : 's'} linked to this merchant.`}
            actionLabel="Manage offers"
            onAction={() => navigate(`/merchants/${merchant.id}/offers`)}
          />
        ) : null}
        {tab === 'redemptions' ? (
          <PlaceholderTab
            title="Redemptions"
            body={`${merchant.redeemedCount.toLocaleString()} successful redemption${merchant.redeemedCount === 1 ? '' : 's'} recorded for this merchant.`}
            actionLabel="View redemptions"
            onAction={() => navigate('/redemptions')}
          />
        ) : null}
        {tab === 'reviews' ? (
          <PlaceholderTab
            title="Reviews"
            body={`${merchant.ratingsCount} review${merchant.ratingsCount === 1 ? '' : 's'} · average ${merchant.rating.toFixed(1)}.`}
            actionLabel="View reviews"
            onAction={() => navigate('/reviews')}
          />
        ) : null}
        {tab === 'members' ? (
          <PlaceholderTab
            title="Members reached"
            body={`${merchant.membersReached.toLocaleString()} member${merchant.membersReached === 1 ? '' : 's'} reached through this merchant.`}
            actionLabel="View members"
            onAction={() => navigate('/members')}
          />
        ) : null}
        {tab === 'activity' ? <ActivityList merchant={merchant} /> : null}
      </div>

      <ConfirmDialog
        open={confirm === 'deactivate'}
        title="Deactivate merchant"
        message={`Deactivate “${merchant.businessName}”?`}
        confirmLabel="Deactivate"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          void (async () => {
            try {
              await updateMerchantStatusApi(merchant.id, 'inactive')
              setConfirm(null)
              await loadMerchant()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to deactivate merchant')
              setConfirm(null)
            }
          })()
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete merchant"
        message={`Soft delete “${merchant.businessName}”?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          void (async () => {
            try {
              await softDeleteMerchantApi(merchant.id)
              setConfirm(null)
              navigate('/merchants')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to delete merchant')
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
        active
          ? 'border-gold text-white'
          : 'border-transparent text-white/55 hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function OverviewTab({
  merchant,
  canCreateOffer,
}: {
  merchant: Merchant
  canCreateOffer: boolean
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Redeemed 30D" value={merchant.redeemed30d.toLocaleString()} />
          <StatCard label="Unique members" value={merchant.uniqueMembers.toLocaleString()} />
          <StatCard label="Avg rating" value={merchant.rating.toFixed(1)} />
          <StatCard label="Profile views" value={merchant.profileViews.toLocaleString()} />
        </div>

        <section className="rounded-xl border border-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-navy">Live offers</h2>
            {canCreateOffer ? (
              <Link
                to={`/merchants/${merchant.id}/offers`}
                className="inline-flex h-8 items-center rounded-lg bg-navy px-3 text-[12px] font-semibold text-white hover:bg-navy-secondary"
              >
                + Add offer
              </Link>
            ) : null}
          </div>
          <div className="space-y-3">
            {merchant.offers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-page px-4 py-6 text-center text-[13px] text-muted">
                No offers yet
              </p>
            ) : (
              merchant.offers.map((offer) => (
                <article key={offer.id} className="rounded-lg border border-border px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-semibold text-navy">{offer.title}</p>
                      <p className="mt-0.5 text-[12px] text-muted">{offer.details}</p>
                      <p className="mt-1 text-[12px] text-muted">Ends {offer.endsAt}</p>
                    </div>
                    <span
                      className={[
                        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                        offer.status === 'live'
                          ? 'bg-[#E8F6F0] text-success'
                          : 'bg-[#F0EEEA] text-muted',
                      ].join(' ')}
                    >
                      {offer.status === 'live' ? 'Live' : 'Expired'}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <ContactHoursCard merchant={merchant} />
        </section>

        <section className="rounded-xl border border-border bg-white p-5 xl:hidden">
          <h2 className="mb-4 text-[15px] font-bold text-navy">Recent activity</h2>
          <ActivityList merchant={merchant} compact />
        </section>
      </div>

      <aside className="hidden xl:block">
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 text-[15px] font-bold text-navy">Recent activity</h2>
          <ActivityList merchant={merchant} compact />
        </section>
      </aside>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-[26px] font-bold tracking-[-0.02em] text-navy">{value}</p>
    </article>
  )
}

function ContactHoursCard({ merchant }: { merchant: Merchant }) {
  const rows = [
    { label: 'Person in charge', value: merchant.picName || '—' },
    { label: 'Mobile', value: merchant.phone || '—' },
    { label: 'Email', value: merchant.email || '—' },
    {
      label: 'WhatsApp',
      value:
        merchant.whatsapp && merchant.whatsapp === merchant.phone
          ? 'Same as mobile'
          : merchant.whatsapp || '—',
    },
    { label: 'Mon – Fri', value: merchant.hours.weekday },
    { label: 'Sat – Sun', value: merchant.hours.weekend },
    { label: 'Public holidays', value: merchant.hours.publicHoliday },
  ]

  return (
    <>
      <h2 className="mb-4 text-[15px] font-bold text-navy">Contact & hours</h2>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-1 gap-0.5 text-[13px] sm:grid-cols-[120px_1fr] sm:gap-2">
            <dt className="text-muted">{row.label}</dt>
            <dd className="break-words font-medium text-navy">{row.value}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

function ActivityList({
  merchant,
  compact = false,
}: {
  merchant: Merchant
  compact?: boolean
}) {
  if (merchant.activities.length === 0) {
    return <p className="text-[13px] text-muted">No activity yet.</p>
  }

  return (
    <ul className={compact ? 'space-y-3' : 'space-y-3 rounded-xl border border-border bg-white p-5'}>
      {!compact ? <h2 className="mb-1 text-[15px] font-bold text-navy">Activity log</h2> : null}
      {merchant.activities.map((item) => (
        <li key={item.id} className="flex gap-3 text-[13px]">
          <span className="w-14 shrink-0 font-semibold text-muted">{item.dateLabel}</span>
          <span className="text-navy">
            {item.description} — <span className="text-muted">{item.actor}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function PlaceholderTab({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-white px-5 py-8 text-center">
      <h2 className="text-[16px] font-bold text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-[13px] text-muted">{body}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white hover:bg-navy-secondary"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
