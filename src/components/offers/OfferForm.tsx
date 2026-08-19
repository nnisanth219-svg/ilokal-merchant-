import { useState, type InputHTMLAttributes } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Offer, OfferFormErrors, OfferFormValues, OfferStatus, OfferType } from '../../types/offer'

const MERCHANT_OPTIONS = [
  { id: 'm-0148', name: 'Kedai Kopi Seri Wangi' },
  { id: 'm-0203', name: 'Batik Warisan Gallery' },
  { id: 'm-0217', name: 'Ipoh White Coffee Co.' },
  { id: 'm-0091', name: 'Melaka Nyonya Kitchen' },
  { id: 'm-0176', name: 'JB Sports Hub' },
] as const

interface OfferFormProps {
  mode: 'create' | 'edit'
  initialValues: OfferFormValues
  offer?: Offer
  onSubmit: (values: OfferFormValues) => void
  onSaveDraft?: (values: OfferFormValues) => void
}

export function OfferForm({
  mode,
  initialValues,
  offer,
  onSubmit,
  onSaveDraft,
}: OfferFormProps) {
  const navigate = useNavigate()
  const [values, setValues] = useState<OfferFormValues>(initialValues)
  const [errors, setErrors] = useState<OfferFormErrors>({})

  function updateField<K extends keyof OfferFormValues>(
    key: K,
    value: OfferFormValues[K],
  ): void {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): OfferFormErrors {
    const next: OfferFormErrors = {}
    if (!values.merchantId) next.merchantId = 'Merchant is required'
    if (!values.title.trim()) next.title = 'Offer title is required'
    if (!values.description.trim()) next.description = 'Description is required'
    if (!values.benefitValue.trim()) next.benefitValue = 'Benefit is required'
    if (!values.validFrom) next.validFrom = 'Start date is required'
    if (!values.validTo) next.validTo = 'End date is required'
    return next
  }

  function handleSubmit(): void {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit(values)
  }

  function handleDraft(): void {
    if (onSaveDraft) {
      onSaveDraft({ ...values, status: 'draft' })
      return
    }
    onSubmit({ ...values, status: 'draft' })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex min-h-16 shrink-0 flex-col gap-3 border-b border-border bg-white px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
        <div className="min-w-0">
          <p className="text-[12px] text-muted">
            <Link to="/offers" className="hover:text-navy">
              Offers
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-navy">
              {mode === 'create' ? 'New offer' : 'Edit offer'}
            </span>
          </p>
          <h1 className="truncate text-[18px] font-bold text-navy">
            {mode === 'create' ? 'Create offer' : offer?.title ?? 'Edit offer'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/offers')}
            className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page sm:flex-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDraft}
            className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page sm:flex-none"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex h-9 min-h-[36px] w-full items-center justify-center rounded-lg bg-action px-3.5 text-[13px] font-semibold text-white hover:bg-[#c82027] sm:w-auto"
          >
            {mode === 'create' ? 'Create offer' : 'Save changes'}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <section className="rounded-xl border border-border bg-white p-5">
            <h2 className="text-[15px] font-bold text-navy">Offer details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <FieldLabel required>Merchant</FieldLabel>
                <select
                  value={values.merchantId}
                  onChange={(e) => updateField('merchantId', e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                >
                  {MERCHANT_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors.merchantId ? (
                  <p className="mt-1 text-[12px] text-action">{errors.merchantId}</p>
                ) : null}
              </div>
              <div>
                <FieldLabel required>Offer title</FieldLabel>
                <TextInput
                  value={values.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
                {errors.title ? (
                  <p className="mt-1 text-[12px] text-action">{errors.title}</p>
                ) : null}
              </div>
              <div>
                <FieldLabel required>Offer description</FieldLabel>
                <textarea
                  value={values.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="min-h-[96px] w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
                {errors.description ? (
                  <p className="mt-1 text-[12px] text-action">{errors.description}</p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Offer type</FieldLabel>
                  <select
                    value={values.offerType}
                    onChange={(e) => updateField('offerType', e.target.value as OfferType)}
                    className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                  >
                    <option value="percentage">Percentage discount</option>
                    <option value="fixed">Fixed discount</option>
                    <option value="free_item">Free item</option>
                    <option value="set_price">Set price</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <FieldLabel required>Benefit</FieldLabel>
                  <TextInput
                    value={values.benefitValue}
                    onChange={(e) => updateField('benefitValue', e.target.value)}
                    placeholder="15%"
                  />
                  {errors.benefitValue ? (
                    <p className="mt-1 text-[12px] text-action">{errors.benefitValue}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white p-5">
            <h2 className="text-[15px] font-bold text-navy">Eligibility & validity</h2>
            <div className="mt-4 space-y-4">
              <div>
                <FieldLabel>Eligibility</FieldLabel>
                <TextInput
                  value={values.eligibility}
                  onChange={(e) => updateField('eligibility', e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel required>Valid from</FieldLabel>
                  <TextInput
                    type="date"
                    value={values.validFrom}
                    onChange={(e) => updateField('validFrom', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel required>Valid to</FieldLabel>
                  <TextInput
                    type="date"
                    value={values.validTo}
                    onChange={(e) => updateField('validTo', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Redemption limits</FieldLabel>
                <TextInput
                  value={values.redemptionLimit}
                  onChange={(e) => updateField('redemptionLimit', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Status</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: 'live', label: 'Live' },
                      { value: 'scheduled', label: 'Scheduled' },
                      { value: 'draft', label: 'Draft' },
                      { value: 'paused', label: 'Paused' },
                      { value: 'expired', label: 'Expired' },
                    ] as { value: OfferStatus; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField('status', opt.value)}
                      className={[
                        'h-9 rounded-lg border px-3 text-[13px] font-semibold',
                        values.status === opt.value
                          ? 'border-navy bg-navy text-white'
                          : 'border-border bg-white text-navy hover:bg-page',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-[12px] font-semibold text-navy">
      {children}
      {required ? <span className="text-action"> *</span> : null}
    </label>
  )
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10',
        props.className ?? '',
      ].join(' ')}
    />
  )
}
