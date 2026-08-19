import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MerchantWizard } from '../components/merchants/MerchantWizard'
import {
  getMerchantById,
  merchantToFormValues,
  subscribeMerchants,
  updateMerchant,
} from '../services/merchantStore'

export function EditMerchantPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [merchant, setMerchant] = useState(() => getMerchantById(id))

  useEffect(() => {
    setMerchant(getMerchantById(id))
    return subscribeMerchants(() => setMerchant(getMerchantById(id)))
  }, [id])

  if (!merchant) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[20px] font-bold text-navy">Merchant not found</h1>
          <Link to="/merchants" className="mt-3 inline-block text-[13px] font-semibold text-navy underline">
            Back to merchants
          </Link>
        </div>
      </div>
    )
  }

  return (
    <MerchantWizard
      mode="edit"
      merchant={merchant}
      initialValues={merchantToFormValues(merchant)}
      onSubmit={(values) => {
        updateMerchant(merchant.id, values)
        navigate(`/merchants/${merchant.id}`)
      }}
    />
  )
}
