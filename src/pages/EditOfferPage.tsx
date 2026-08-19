import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { OfferForm } from '../components/offers/OfferForm'
import {
  getOfferById,
  offerToFormValues,
  subscribeOffers,
  updateOffer,
} from '../services/offerStore'

export function EditOfferPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [offer, setOffer] = useState(() => getOfferById(id))

  useEffect(() => {
    setOffer(getOfferById(id))
    return subscribeOffers(() => setOffer(getOfferById(id)))
  }, [id])

  if (!offer) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[20px] font-bold text-navy">Offer not found</h1>
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
      onSubmit={(values) => {
        updateOffer(offer.id, values)
        navigate(`/offers/${offer.id}`)
      }}
    />
  )
}
