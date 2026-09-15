import type { OfferTypeValue, OfferWriteInput } from '../types/offer.js'
import { AppError } from '../utils/errors.js'

const OFFER_TYPES = new Set([
  'percentage',
  'fixed',
  'free_item',
  'set_price',
  'other',
  'bogo',
  'free_gift',
  'member_pricing',
  'voucher',
])

const OFFER_STATUSES = new Set(['live', 'scheduled', 'draft', 'expired', 'paused'])

function asString(value: unknown, field: string): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new AppError(400, `${field} must be a string`)
  return value.trim()
}

function asOptionalInt(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number.parseInt(value, 10)
    if (!Number.isFinite(n)) throw new AppError(400, `${field} must be a number`)
    return n
  }
  throw new AppError(400, `${field} must be a number`)
}

function parseDateOnly(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(400, `${field} must be YYYY-MM-DD`)
  }
  const d = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) throw new AppError(400, `${field} is invalid`)
  return value
}

export function parseOfferWriteBody(body: unknown, partial = false): OfferWriteInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const raw = body as Record<string, unknown>

  const merchantId = asString(raw.merchantId, 'merchantId')
  const title = asString(raw.title, 'title')
  const offerTypeRaw = asString(raw.offerType, 'offerType')
  const validFromRaw = asString(raw.validFrom, 'validFrom')
  const validToRaw = asString(raw.validTo, 'validTo')

  const input: OfferWriteInput = {}

  if (!partial || 'merchantId' in raw) input.merchantId = merchantId
  if (!partial || 'title' in raw) input.title = title

  if (!partial || 'offerType' in raw) {
    if (!OFFER_TYPES.has(offerTypeRaw)) throw new AppError(400, 'Invalid offerType')
    input.offerType = offerTypeRaw as OfferTypeValue
  }

  if (!partial || 'validFrom' in raw) {
    if (!validFromRaw) throw new AppError(400, 'validFrom is required')
    input.validFrom = parseDateOnly(validFromRaw, 'validFrom')
  }
  if (!partial || 'validTo' in raw) {
    if (!validToRaw) throw new AppError(400, 'validTo is required')
    input.validTo = parseDateOnly(validToRaw, 'validTo')
  }

  if (input.validFrom && input.validTo && input.validFrom > input.validTo) {
    throw new AppError(400, 'start date must not be after end date')
  }

  if (!partial) {
    if (!input.merchantId) throw new AppError(400, 'merchantId is required')
    if (!input.title) throw new AppError(400, 'title is required')
    if (!input.offerType) throw new AppError(400, 'offerType is required')
    if (!input.validFrom) throw new AppError(400, 'validFrom is required')
    if (!input.validTo) throw new AppError(400, 'validTo is required')
  } else {
    if ('merchantId' in raw && !merchantId) throw new AppError(400, 'merchantId cannot be empty')
    if ('title' in raw && !title) throw new AppError(400, 'title cannot be empty')
  }

  if ('description' in raw) input.description = asString(raw.description, 'description')
  if ('termsAndConditions' in raw) {
    input.termsAndConditions = asString(raw.termsAndConditions, 'termsAndConditions')
  }
  if ('benefitValue' in raw) input.benefitValue = asString(raw.benefitValue, 'benefitValue')
  if ('eligibility' in raw) input.eligibility = asString(raw.eligibility, 'eligibility')
  if ('redemptionInstructions' in raw) {
    input.redemptionInstructions = asString(
      raw.redemptionInstructions,
      'redemptionInstructions',
    )
  }
  if ('redemptionLimit' in raw) {
    input.redemptionLimit = asString(raw.redemptionLimit, 'redemptionLimit')
  }
  if ('maxRedemptions' in raw) {
    input.maxRedemptions = asOptionalInt(raw.maxRedemptions, 'maxRedemptions') ?? null
  }
  if ('maxRedemptionsPerMember' in raw) {
    input.maxRedemptionsPerMember =
      asOptionalInt(raw.maxRedemptionsPerMember, 'maxRedemptionsPerMember') ?? null
  }
  if ('imageUrl' in raw) {
    input.imageUrl =
      raw.imageUrl === null ? null : asString(raw.imageUrl, 'imageUrl') || null
  }

  const status = raw.status === undefined ? undefined : asString(raw.status, 'status')
  if (status) {
    if (!OFFER_STATUSES.has(status)) throw new AppError(400, 'Invalid status')
    input.status = status as OfferWriteInput['status']
  }

  return input
}

export function parseOfferStatusBody(
  body: unknown,
): 'live' | 'scheduled' | 'draft' | 'expired' | 'paused' {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const status = (body as Record<string, unknown>).status
  if (typeof status !== 'string' || !OFFER_STATUSES.has(status)) {
    throw new AppError(400, 'Invalid status')
  }
  return status as 'live' | 'scheduled' | 'draft' | 'expired' | 'paused'
}
