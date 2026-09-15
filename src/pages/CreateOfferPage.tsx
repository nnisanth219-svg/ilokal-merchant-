import { useNavigate, useSearchParams } from 'react-router-dom'
import { OfferForm } from '../components/offers/OfferForm'
import { createOfferApi } from '../services/offerApi'
import { emptyOfferForm } from '../services/offerStore'

export function CreateOfferPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const merchantId = params.get('merchantId') ?? ''

  return (
    <OfferForm
      mode="create"
      initialValues={emptyOfferForm(merchantId)}
      onSubmit={async (values) => {
        const created = await createOfferApi(values)
        navigate(`/offers/${created.id}`)
      }}
      onSaveDraft={async (values) => {
        const created = await createOfferApi({ ...values, status: 'draft' })
        navigate(`/offers/${created.id}`)
      }}
    />
  )
}
