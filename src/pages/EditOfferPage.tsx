import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { OfferForm } from '../components/offers/OfferForm'
import { getOfferApi, updateOfferApi } from '../services/offerApi'
import { offerToFormValues } from '../services/offerStore'
import type { Offer } from '../types/offer'

export function EditOfferPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getOfferApi(id, true)
      .then((data) => {
        if (!cancelled) setOffer(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setOffer(null)
          setError(err instanceof Error ? err.message : 'Unable to load offer')
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

  return (
    <OfferForm
      mode="edit"
      offer={offer}
      initialValues={offerToFormValues(offer)}
      onSubmit={async (values) => {
        await updateOfferApi(offer.id, values)
        navigate(`/offers/${offer.id}`)
      }}
    />
  )
}
