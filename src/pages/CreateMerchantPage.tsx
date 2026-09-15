import { useNavigate } from 'react-router-dom'
import { MerchantWizard } from '../components/merchants/MerchantWizard'
import { createMerchantApi } from '../services/merchantApi'
import { emptyMerchantForm } from '../services/merchantStore'

export function CreateMerchantPage() {
  const navigate = useNavigate()

  return (
    <MerchantWizard
      mode="create"
      initialValues={emptyMerchantForm()}
      onSubmit={async (values) => {
        const created = await createMerchantApi(values)
        navigate(`/merchants/${created.id}`)
      }}
    />
  )
}
