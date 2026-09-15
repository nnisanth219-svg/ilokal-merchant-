import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MerchantWizard } from '../components/merchants/MerchantWizard'
import { getMerchantApi, updateMerchantApi } from '../services/merchantApi'
import { merchantToFormValues } from '../services/merchantStore'
import type { Merchant } from '../types/merchant'

export function EditMerchantPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getMerchantApi(id, true)
      .then((data) => {
        if (!cancelled) setMerchant(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMerchant(null)
          setError(err instanceof Error ? err.message : 'Unable to load merchant')
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
          <Link
            to="/merchants"
            className="mt-3 inline-block text-[13px] font-semibold text-navy underline"
          >
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
      onSubmit={async (values) => {
        await updateMerchantApi(merchant.id, values)
        navigate(`/merchants/${merchant.id}`)
      }}
    />
  )
}
