import {
  useMemo,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { MERCHANT_CATEGORIES } from '../../data/merchants'
import { geocodeMerchantLocationApi } from '../../services/merchantApi'
import type {
  Merchant,
  MerchantFormErrors,
  MerchantFormValues,
  MerchantOutletType,
  MerchantPriceRange,
  MerchantWizardStep,
  PublishStatus,
} from '../../types/merchant'

const STEPS: {
  id: MerchantWizardStep
  number: number
  title: string
  subtitle: string
}[] = [
  { id: 'business', number: 1, title: 'Business details', subtitle: 'Name, category, registration' },
  { id: 'location', number: 2, title: 'Location', subtitle: 'Address, postcode, lat/long' },
  { id: 'media', number: 3, title: 'Photos & media', subtitle: 'Logo, cover, gallery' },
  { id: 'contact', number: 4, title: 'Contact & hours', subtitle: 'PIC, phone, opening times' },
  { id: 'publish', number: 5, title: 'Offers & publish', subtitle: 'Member benefit, review' },
]

interface MerchantWizardProps {
  mode: 'create' | 'edit'
  initialValues: MerchantFormValues
  merchant?: Merchant
  onSubmit: (values: MerchantFormValues) => void | Promise<void>
  onSaveDraft: (values: MerchantFormValues) => Promise<Merchant>
}

export function MerchantWizard({
  mode,
  initialValues,
  merchant,
  onSubmit,
  onSaveDraft,
}: MerchantWizardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState<MerchantWizardStep>('business')
  const [values, setValues] = useState<MerchantFormValues>(initialValues)
  const [errors, setErrors] = useState<MerchantFormErrors>({})
  const [draftSaved, setDraftSaved] = useState(false)
  const [savedMerchant, setSavedMerchant] = useState<Merchant | undefined>(merchant)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)

  const previewCode = savedMerchant?.merchantCode ?? 'Assigned on save'
  const previewSlug =
    savedMerchant?.slug ??
    (values.businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
      'assigned-on-save')
  const createdBy = savedMerchant
    ? `${savedMerchant.createdBy} · ${new Date(savedMerchant.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`
    : `${user?.name ?? 'You'} · today`

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  function updateField<K extends keyof MerchantFormValues>(
    key: K,
    value: MerchantFormValues[K],
  ): void {
    setValues((prev) => ({ ...prev, [key]: value }))
    setDraftSaved(false)
    setSaveError(null)
  }

  async function persistDraft(): Promise<boolean> {
    const nextErrors = validateBusiness()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStep('business')
      return false
    }
    setSavingDraft(true)
    setSaveError(null)
    try {
      const saved = await onSaveDraft(values)
      setSavedMerchant(saved)
      setDraftSaved(true)
      return true
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save draft')
      return false
    } finally {
      setSavingDraft(false)
    }
  }

  function validateBusiness(): MerchantFormErrors {
    const next: MerchantFormErrors = {}
    if (!values.businessName.trim()) next.businessName = 'Merchant name is required'
    if (!values.category.trim()) next.category = 'Primary category is required'
    if (!values.description.trim()) next.description = 'Short description is required'
    return next
  }

  function handleSaveContinue(): void {
    if (step === 'business') {
      const nextErrors = validateBusiness()
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) return
    }

    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1].id)
      return
    }

    const nextErrors = validateBusiness()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStep('business')
      return
    }
    void Promise.resolve(onSubmit(values)).catch((err: unknown) => {
      setSaveError(err instanceof Error ? err.message : 'Unable to publish merchant')
    })
  }

  const readiness = useMemo(() => {
    const checks = [
      Boolean(values.businessName.trim()),
      Boolean(values.address.trim()),
      Boolean(values.picName.trim() && values.phone.trim()),
      Boolean(values.offerSummary.trim()) || mode === 'edit',
    ]
    return { done: checks.filter(Boolean).length, total: checks.length }
  }, [values, mode])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
      <header className="flex min-h-16 shrink-0 flex-col gap-3 border-b border-border bg-navy px-4 py-3 text-white sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
        <div className="min-w-0">
          <p className="text-[12px] text-white/65">
            <Link to="/merchants" className="hover:text-gold">
              Merchants
            </Link>
            <span className="mx-1.5 text-white/40">/</span>
            <span className="text-white">
              {mode === 'create' ? 'New merchant' : 'Edit merchant'}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-gold">
            {draftSaved ? 'Draft saved' : 'Unsaved changes'}
          </p>
          {saveError ? (
            <p className="mt-0.5 text-[11px] font-medium text-[#ffb4b4]">{saveError}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/merchants')}
            className="inline-flex h-10 min-h-[40px] flex-1 items-center justify-center rounded-lg border border-white/20 px-3.5 text-[13px] font-semibold text-white/90 hover:bg-white/5 sm:flex-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void persistDraft()}
            disabled={savingDraft}
            className="inline-flex h-10 min-h-[40px] flex-1 items-center justify-center rounded-lg border border-white/20 px-3.5 text-[13px] font-semibold text-white hover:bg-white/5 sm:flex-none disabled:opacity-60"
          >
            {savingDraft ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={handleSaveContinue}
            className="inline-flex h-10 min-h-[40px] w-full items-center justify-center rounded-lg bg-gold px-3.5 text-[13px] font-bold text-navy hover:bg-[#e5a814] sm:w-auto"
          >
            {stepIndex === STEPS.length - 1 ? 'Publish' : 'Save & continue'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        <aside className="hidden w-[260px] shrink-0 overflow-y-auto border-r border-border bg-[#FBFBF9] p-4 md:block">
          <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            Setup steps
          </p>
          <div className="flex flex-col gap-2">
            {STEPS.map((item) => {
              const active = item.id === step
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={[
                    'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition',
                    active
                      ? 'bg-navy text-white shadow-[0_8px_20px_rgba(16,43,89,0.18)]'
                      : 'border border-border bg-white text-navy hover:border-navy/20',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold',
                      active ? 'bg-gold text-navy' : 'bg-page text-muted',
                    ].join(' ')}
                  >
                    {item.number}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold">{item.title}</span>
                    <span
                      className={[
                        'mt-0.5 block text-[11px]',
                        active ? 'text-white/65' : 'text-muted',
                      ].join(' ')}
                    >
                      {item.subtitle}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {STEPS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(item.id)}
                className={[
                  'inline-flex h-10 min-h-[40px] shrink-0 items-center rounded-full px-3 text-[12px] font-semibold',
                  item.id === step
                    ? 'bg-navy text-white'
                    : 'border border-border bg-white text-navy',
                ].join(' ')}
              >
                {item.number}. {item.title}
              </button>
            ))}
          </div>

          {step === 'business' ? (
            <BusinessStep
              values={values}
              errors={errors}
              previewCode={previewCode}
              previewSlug={previewSlug}
              createdBy={createdBy}
              onChange={updateField}
            />
          ) : null}
          {step === 'location' ? <LocationStep values={values} onChange={updateField} /> : null}
          {step === 'media' ? <MediaStep values={values} onChange={updateField} /> : null}
          {step === 'contact' ? <ContactStep values={values} onChange={updateField} /> : null}
          {step === 'publish' ? (
            <PublishStep values={values} readiness={readiness} onChange={updateField} />
          ) : null}
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

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        'min-h-[96px] w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10',
        props.className ?? '',
      ].join(' ')}
    />
  )
}

function BusinessStep({
  values,
  errors,
  previewCode,
  previewSlug,
  createdBy,
  onChange,
}: {
  values: MerchantFormValues
  errors: MerchantFormErrors
  previewCode: string
  previewSlug: string
  createdBy: string
  onChange: <K extends keyof MerchantFormValues>(key: K, value: MerchantFormValues[K]) => void
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-[22px] font-bold tracking-[-0.02em] text-navy">Business details</h2>
      <p className="mt-1 text-[13px] text-muted">
        This is what members see first in search and on the map.
      </p>

      <div className="mt-5 space-y-4 rounded-xl border border-border bg-white p-5">
        <div>
          <FieldLabel required>Merchant name</FieldLabel>
          <TextInput
            value={values.businessName}
            onChange={(e) => onChange('businessName', e.target.value)}
          />
          {errors.businessName ? (
            <p className="mt-1 text-[12px] text-action">{errors.businessName}</p>
          ) : null}
        </div>
        <div>
          <FieldLabel>Legal / trading name</FieldLabel>
          <TextInput
            value={values.legalName}
            onChange={(e) => onChange('legalName', e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Primary category</FieldLabel>
            <select
              value={values.category}
              onChange={(e) => onChange('category', e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
            >
              {MERCHANT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Sub-categories / tags</FieldLabel>
            <TextInput
              value={values.subCategories}
              onChange={(e) => onChange('subCategories', e.target.value)}
              placeholder="Kopitiam, Halal, Breakfast"
            />
          </div>
        </div>
        <div>
          <FieldLabel required>Short description</FieldLabel>
          <TextArea
            value={values.description}
            onChange={(e) => onChange('description', e.target.value)}
          />
          {errors.description ? (
            <p className="mt-1 text-[12px] text-action">{errors.description}</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Business registration no.</FieldLabel>
            <TextInput
              value={values.registrationNo}
              onChange={(e) => onChange('registrationNo', e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Price range</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {(['RM', 'RM RM', 'RM RM RM'] as MerchantPriceRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => onChange('priceRange', range)}
                  className={[
                    'h-10 rounded-lg border px-3 text-[13px] font-semibold',
                    values.priceRange === range
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-navy hover:bg-page',
                  ].join(' ')}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Status on publish</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'pending', label: 'Pending review' },
                ] as { value: PublishStatus; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange('publishStatus', opt.value)}
                  className={[
                    'h-10 rounded-lg border px-3 text-[13px] font-semibold',
                    values.publishStatus === opt.value
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-navy hover:bg-page',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Featured merchant</FieldLabel>
            <label className="flex h-10 items-center justify-between rounded-lg border border-border bg-white px-3">
              <span className="text-[13px] text-navy">Show in app spotlight</span>
              <button
                type="button"
                role="switch"
                aria-checked={values.featured}
                onClick={() => onChange('featured', !values.featured)}
                className={[
                  'relative h-6 w-11 rounded-full transition',
                  values.featured ? 'bg-success' : 'bg-[#D6D2CB]',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white transition',
                    values.featured ? 'left-[22px]' : 'left-0.5',
                  ].join(' ')}
                />
              </button>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          Auto-generated
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <InfoItem label="Merchant ID" value={previewCode} />
          <InfoItem label="Slug" value={previewSlug} />
          <InfoItem label="Created by" value={createdBy} />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#F0D78A] bg-[#FFF8E5] px-4 py-3 text-[13px] text-[#7A5A00]">
        A merchant only appears in the app once Status = Active and at least one live offer exists.
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-navy">{value}</p>
    </div>
  )
}

function LocationStep({
  values,
  onChange,
}: {
  values: MerchantFormValues
  onChange: <K extends keyof MerchantFormValues>(key: K, value: MerchantFormValues[K]) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [confirmNote, setConfirmNote] = useState<string | null>(null)
  const lat = Number.parseFloat(values.latitude)
  const lng = Number.parseFloat(values.longitude)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)

  async function confirmLocation(): Promise<void> {
    setConfirming(true)
    setConfirmError(null)
    setConfirmNote(null)
    try {
      if (values.address.trim()) {
        const result = await geocodeMerchantLocationApi({
          address: values.address,
          postcode: values.postcode,
        })
        onChange('latitude', result.latitude)
        onChange('longitude', result.longitude)
        setConfirmNote(result.displayName)
        return
      }

      if (!navigator.geolocation) {
        throw new Error('Enter an address or allow location access to confirm the pin.')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, () =>
          reject(new Error('Location permission was denied.')),
        )
      })
      onChange('latitude', position.coords.latitude.toFixed(6))
      onChange('longitude', position.coords.longitude.toFixed(6))
      setConfirmNote('Pin set from this device location.')
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Unable to confirm location')
    } finally {
      setConfirming(false)
    }
  }
  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="text-[22px] font-bold tracking-[-0.02em] text-navy">Location</h2>
      <p className="mt-1 text-[13px] text-muted">Address, postcode and pin placement.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4 rounded-xl border border-border bg-white p-5">
          <div>
            <FieldLabel>Address</FieldLabel>
            <TextInput
              value={values.address}
              onChange={(e) => onChange('address', e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Postcode</FieldLabel>
              <TextInput
                value={values.postcode}
                onChange={(e) => onChange('postcode', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Latitude</FieldLabel>
              <TextInput
                value={values.latitude}
                onChange={(e) => onChange('latitude', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Longitude</FieldLabel>
              <TextInput
                value={values.longitude}
                onChange={(e) => onChange('longitude', e.target.value)}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Service area</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'single', label: 'Single outlet' },
                  { value: 'multi', label: 'Multi-outlet chain' },
                  { value: 'online', label: 'Online only' },
                ] as { value: MerchantOutletType; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange('outletType', opt.value)}
                  className={[
                    'h-10 rounded-lg border px-3 text-[13px] font-semibold',
                    values.outletType === opt.value
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-navy hover:bg-page',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void confirmLocation()}
            disabled={confirming}
            className="inline-flex h-9 items-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white hover:bg-navy-secondary disabled:opacity-60"
          >
            {confirming ? 'Confirming…' : 'Confirm location'}
          </button>
          {confirmError ? <p className="text-[12px] text-action">{confirmError}</p> : null}
          {confirmNote ? <p className="text-[12px] text-success">{confirmNote}</p> : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[12px] font-semibold text-navy">Map preview</p>
            <p className="text-[11px] text-muted">
              {hasCoords ? 'Confirmed coordinates from the address or device location.' : 'Confirm location to place a pin.'}
            </p>
          </div>
          {hasCoords ? (
            <iframe
              title="Merchant map preview"
              className="h-[280px] w-full border-0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
            />
          ) : (
            <div className="relative h-[280px] bg-[linear-gradient(135deg,#E8EEF6_0%,#F4F2ED_55%,#DCE6F4_100%)]">
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy text-gold shadow-lg">
                  ●
                </span>
                <span className="mt-2 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-navy shadow">
                  No pin yet
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MediaStep({
  values,
  onChange,
}: {
  values: MerchantFormValues
  onChange: <K extends keyof MerchantFormValues>(key: K, value: MerchantFormValues[K]) => void
}) {
  function readFile(file: File | undefined, onDone: (url: string) => void): void {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onDone(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-[22px] font-bold tracking-[-0.02em] text-navy">Photos & media</h2>
      <p className="mt-1 text-[13px] text-muted">
        Logo, cover and gallery — local preview only.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <UploadCard
          title="Logo"
          hint="Square PNG/JPG · min 256×256"
          preview={values.logoUrl}
          onPick={(file) => readFile(file, (url) => onChange('logoUrl', url))}
          onClear={() => onChange('logoUrl', null)}
        />
        <UploadCard
          title="Cover image"
          hint="Landscape · recommended 1600×900"
          preview={values.coverUrl}
          onPick={(file) => readFile(file, (url) => onChange('coverUrl', url))}
          onClear={() => onChange('coverUrl', null)}
        />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-navy">Gallery</p>
            <p className="text-[11px] text-muted">Up to 8 images · frontend preview only</p>
          </div>
          <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-border bg-white px-3 text-[12px] font-semibold text-navy hover:bg-page">
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                readFile(e.target.files?.[0], (url) =>
                  onChange('galleryUrls', [...values.galleryUrls, url].slice(0, 8)),
                )
              }
            />
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {values.galleryUrls.map((url, index) => (
            <div
              key={`${url.slice(0, 24)}-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-border"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() =>
                  onChange(
                    'galleryUrls',
                    values.galleryUrls.filter((_, i) => i !== index),
                  )
                }
                className="absolute right-1 top-1 rounded bg-navy/80 px-1.5 text-[10px] font-semibold text-white"
              >
                Remove
              </button>
            </div>
          ))}
          {values.galleryUrls.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-border bg-page px-4 py-8 text-center text-[12px] text-muted">
              No gallery images yet
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function UploadCard({
  title,
  hint,
  preview,
  onPick,
  onClear,
}: {
  title: string
  hint: string
  preview: string | null
  onPick: (file: File | undefined) => void
  onClear: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-[13px] font-semibold text-navy">{title}</p>
      <p className="text-[11px] text-muted">{hint}</p>
      {preview ? (
        <div className="relative mt-3 overflow-hidden rounded-lg border border-border">
          <img src={preview} alt="" className="h-36 w-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 rounded bg-navy/80 px-2 py-1 text-[11px] font-semibold text-white"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="mt-3 flex h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-page text-center hover:border-navy/30">
          <span className="text-[12px] font-semibold text-navy">Upload {title.toLowerCase()}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </label>
      )}
    </div>
  )
}

function ContactStep({
  values,
  onChange,
}: {
  values: MerchantFormValues
  onChange: <K extends keyof MerchantFormValues>(key: K, value: MerchantFormValues[K]) => void
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-[22px] font-bold tracking-[-0.02em] text-navy">Contact & hours</h2>
      <p className="mt-1 text-[13px] text-muted">PIC, phone and opening times.</p>

      <div className="mt-5 space-y-4 rounded-xl border border-border bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Person in charge</FieldLabel>
            <TextInput value={values.picName} onChange={(e) => onChange('picName', e.target.value)} />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <TextInput value={values.phone} onChange={(e) => onChange('phone', e.target.value)} />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <TextInput
              type="email"
              value={values.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>WhatsApp</FieldLabel>
            <TextInput
              value={values.whatsapp}
              onChange={(e) => onChange('whatsapp', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4 rounded-xl border border-border bg-white p-5">
        <p className="text-[13px] font-semibold text-navy">Business hours</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel>Mon – Fri</FieldLabel>
            <TextInput
              value={values.hoursWeekday}
              onChange={(e) => onChange('hoursWeekday', e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Sat – Sun</FieldLabel>
            <TextInput
              value={values.hoursWeekend}
              onChange={(e) => onChange('hoursWeekend', e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Public holidays</FieldLabel>
            <TextInput
              value={values.hoursHoliday}
              onChange={(e) => onChange('hoursHoliday', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function PublishStep({
  values,
  readiness,
  onChange,
}: {
  values: MerchantFormValues
  readiness: { done: number; total: number }
  onChange: <K extends keyof MerchantFormValues>(key: K, value: MerchantFormValues[K]) => void
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-[22px] font-bold tracking-[-0.02em] text-navy">Offers & publish</h2>
      <p className="mt-1 text-[13px] text-muted">
        Review merchant information and configure the member benefit.
      </p>

      <div className="mt-5 space-y-4">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-[13px] font-semibold text-navy">Offer / member benefit summary</p>
          <TextArea
            className="mt-3"
            value={values.offerSummary}
            onChange={(e) => onChange('offerSummary', e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-[13px] font-semibold text-navy">Publish readiness</p>
          <p className="mt-1 text-[12px] text-muted">
            {readiness.done} of {readiness.total} checks complete
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-page">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${(readiness.done / readiness.total) * 100}%` }}
            />
          </div>
          <ul className="mt-4 space-y-2 text-[13px] text-navy">
            <li>• Business details {values.businessName ? 'ready' : 'incomplete'}</li>
            <li>• Location {values.address ? 'ready' : 'incomplete'}</li>
            <li>• Contact {values.picName && values.phone ? 'ready' : 'incomplete'}</li>
            <li>
              • Status on publish:{' '}
              <span className="font-semibold capitalize">{values.publishStatus}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
