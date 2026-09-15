import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { OfferStatusBadge } from '../components/offers/OfferStatusBadge'
import { MerchantStatusBadge } from '../components/merchants/MerchantStatusBadge'
import { useAuth } from '../context/AuthContext'
import { getMerchantApi } from '../services/merchantApi'
import { listOffersApi } from '../services/offerApi'
import { canCreateInModule } from '../types/auth'
import type { Merchant } from '../types/merchant'
import type { Offer } from '../types/offer'

export function MerchantOffersPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreateOffer = canCreateInModule(user, 'Offers')
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const [merchantData, offersData] = await Promise.all([
          getMerchantApi(id),
          listOffersApi({ merchantId: id, pageSize: 100 }),
        ])
        if (!cancelled) {
          setMerchant(merchantData)
          setOffers(offersData.offers)
        }
      } catch (err) {
        if (!cancelled) {
          setMerchant(null)
          setOffers([])
          setError(err instanceof Error ? err.message : 'Unable to load offers')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex min-h-16 shrink-0 flex-col gap-3 border-b border-border bg-white px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
        <div className="min-w-0">
          <p className="text-[12px] text-muted">
            <Link to="/merchants" className="hover:text-navy">
              Merchants
            </Link>
            <span className="mx-1.5">/</span>
            <Link to={`/merchants/${merchant.id}`} className="hover:text-navy">
              {merchant.businessName}
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-navy">Offers</span>
          </p>
          <h1 className="text-[18px] font-bold text-navy">Manage offers</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MerchantStatusBadge status={merchant.status} />
          {canCreateOffer ? (
            <Link
              to={`/offers/create?merchantId=${merchant.id}`}
              className="inline-flex h-9 min-h-[36px] w-full items-center justify-center rounded-lg bg-action px-3.5 text-[13px] font-semibold text-white hover:bg-[#c82027] sm:w-auto"
            >
              + Add offer
            </Link>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <p className="mb-4 text-[13px] text-muted">
          Showing offers for <span className="font-semibold text-navy">{merchant.businessName}</span>.
        </p>
        {error ? <p className="mb-3 text-[12px] text-action">{error}</p> : null}

        <div className="space-y-3">
          {offers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white px-5 py-10 text-center text-[13px] text-muted">
              No offers yet for this merchant.
            </div>
          ) : (
            offers.map((offer) => (
              <article key={offer.id} className="rounded-xl border border-border bg-white px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/offers/${offer.id}`)}
                    className="text-left"
                  >
                    <h2 className="text-[15px] font-semibold text-navy">{offer.title}</h2>
                    <p className="mt-1 text-[13px] text-muted">
                      {offer.offerCode} · {offer.benefitLabel}
                    </p>
                    <p className="mt-1 text-[12px] text-muted">{offer.validityLabel}</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <OfferStatusBadge status={offer.status} />
                    <Link
                      to={`/offers/${offer.id}/edit`}
                      className="inline-flex h-8 items-center rounded-lg border border-border bg-white px-3 text-[12px] font-semibold text-navy hover:bg-page"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
