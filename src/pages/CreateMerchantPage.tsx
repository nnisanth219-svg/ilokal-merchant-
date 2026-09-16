import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MerchantWizard } from '../components/merchants/MerchantWizard'
import { createMerchantApi, updateMerchantApi } from '../services/merchantApi'
import { emptyMerchantForm } from '../services/merchantStore'
import type { Merchant } from '../types/merchant'

export function CreateMerchantPage() {
  const navigate = useNavigate()
  const draftIdRef = useRef<string | null>(null)

  async function saveDraft(values: ReturnType<typeof emptyMerchantForm>): Promise<Merchant> {
    const payload = { ...values, publishStatus: 'pending' as const }
    if (draftIdRef.current) return updateMerchantApi(draftIdRef.current, payload)
    const created = await createMerchantApi(payload)
    draftIdRef.current = created.id
    return created
  }

  return (
    <MerchantWizard
      mode="create"
      initialValues={emptyMerchantForm()}
      onSaveDraft={saveDraft}
      onSubmit={async (values) => {
        if (draftIdRef.current) {
          const updated = await updateMerchantApi(draftIdRef.current, values)
          navigate(`/merchants/${updated.id}`)
          return
        }
        const created = await createMerchantApi(values)
        navigate(`/merchants/${created.id}`)
      }}
    />
  )
}
