import { useNavigate } from 'react-router-dom'
import { MerchantWizard } from '../components/merchants/MerchantWizard'
import { createMerchant, emptyMerchantForm } from '../services/merchantStore'

export function CreateMerchantPage() {
  const navigate = useNavigate()

  return (
    <MerchantWizard
      mode="create"
      initialValues={emptyMerchantForm()}
      onSubmit={(values) => {
        const created = createMerchant(values)
        navigate(`/merchants/${created.id}`)
      }}
    />
  )
}
