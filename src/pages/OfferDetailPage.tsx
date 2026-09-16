import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { OfferStatusBadge } from '../components/offers/OfferStatusBadge'
import { useAuth } from '../context/AuthContext'
import {
  getOfferApi,
  restoreOfferApi,
  softDeleteOfferApi,
  updateOfferStatusApi,
} from '../services/offerApi'
import { canDeleteInModule, canEditInModule } from '../types/auth'
import type { Offer } from '../types/offer'

export function OfferDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = canEditInModule(user, 'Offers')
  const canDelete = canDeleteInModule(user, 'Offers')
  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const loadOffer = useCallback(async () => {
    if (!id) {
      setOffer(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getOfferApi(id, true)
      setOffer(data)
    } catch (err) {
      setOffer(null)
      setError(err instanceof Error ? err.message : 'Unable to load offer')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadOffer()
  }, [loadOffer])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-[13px] text-muted">Loading offer…</p>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[20px] font-bold text-navy">Offer not found</h1>
          {error ? <p className="mt-2 text-[13px] text-muted">{error}</p> : null}
          <Link to="/offers" className="mt-3 inline-block text-[13px] font-semibold text-navy underline">
            Back to offers
          </Link>
        </div>
      </div>
    )
  }

  const isPaused = offer.status === 'paused'
  const isDeleted = offer.status === 'deleted'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] text-muted">
              <Link to="/offers" className="hover:text-navy">
                Offers
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-navy">{offer.offerCode}</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] font-bold tracking-[-0.02em] text-navy sm:text-[22px]">
                {offer.title}
              </h1>
              <OfferStatusBadge status={offer.status} />
            </div>
            <p className="mt-1 break-words text-[13px] text-muted">
              {offer.merchantName} · {offer.category}
            </p>
            {error ? <p className="mt-1 text-[12px] text-action">{error}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isDeleted && canEdit ? (
              <Link
                to={`/offers/${offer.id}/edit`}
                className="inline-flex h-10 min-h-[40px] flex-1 items-center justify-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page sm:flex-none"
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
                      setError(null)
                      await restoreOfferApi(offer.id)
                      await loadOffer()
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Unable to restore offer')
                    }
                  })()
                }}
                className="inline-flex h-10 min-h-[40px] flex-1 items-center justify-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page sm:flex-none"
              >
                Restore
              </button>
            ) : null}
            {!isDeleted && canEdit ? (
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    try {
                      setError(null)
                      await updateOfferStatusApi(offer.id, isPaused ? 'live' : 'paused')
                      await loadOffer()
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Unable to update offer')
                    }
                  })()
                }}
                className="inline-flex h-10 min-h-[40px] flex-1 items-center justify-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page sm:flex-none"
              >
                {isPaused ? 'Activate' : 'Pause'}
              </button>
            ) : null}
            {!isDeleted && canDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex h-10 min-h-[40px] w-full items-center justify-center rounded-lg bg-action px-3.5 text-[13px] font-semibold text-white hover:bg-[#c82027] sm:w-auto"
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-white p-5">
            <h2 className="text-[15px] font-bold text-navy">Offer information</h2>
            <dl className="mt-4 space-y-3 text-[13px]">
              <Row label="Offer ID" value={offer.offerCode} />
              <Row label="Status" value={offer.status} />
              <Row label="Merchant" value={offer.merchantName} />
              <Row label="Category" value={offer.category} />
              <Row label="Benefit" value={offer.benefitLabel} />
              <Row label="Description" value={offer.description} />
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-white p-5">
            <h2 className="text-[15px] font-bold text-navy">Rules & activity</h2>
            <dl className="mt-4 space-y-3 text-[13px]">
              <Row label="Validity" value={offer.validityLabel} />
              <Row label="Eligibility" value={offer.eligibility} />
              <Row label="Redemption limit" value={offer.redemptionLimit} />
              <Row
                label="Redemptions"
                value={`${offer.redeemedCount.toLocaleString('en-US')} redeemed`}
              />
              <Row
                label="Created"
                value={new Date(offer.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              />
              <Row
                label="Last updated"
                value={new Date(offer.updatedAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              />
            </dl>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete offer"
        message={`Delete “${offer.title}”?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          void (async () => {
            try {
              setError(null)
              await softDeleteOfferApi(offer.id)
              navigate('/offers')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to delete offer')
              setConfirmDelete(false)
            }
          })()
        }}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[140px_1fr] sm:gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words font-medium capitalize text-navy">{value}</dd>
    </div>
  )
}
