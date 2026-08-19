import { useNavigate, useSearchParams } from 'react-router-dom'
import { OfferForm } from '../components/offers/OfferForm'
import { createOffer, emptyOfferForm } from '../services/offerStore'

export function CreateOfferPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const merchantId = params.get('merchantId') ?? 'm-0148'

  return (
    <OfferForm
      mode="create"
      initialValues={emptyOfferForm(merchantId)}
      onSubmit={(values) => {
        const created = createOffer(values)
        navigate(`/offers/${created.id}`)
      }}
      onSaveDraft={(values) => {
        const created = createOffer({ ...values, status: 'draft' })
        navigate(`/offers/${created.id}`)
      }}
    />
  )
}
