import type { MerchantWriteInput } from '../types/merchant.js'
import { AppError } from '../utils/errors.js'

const PRICE_RANGES = new Set(['RM', 'RM RM', 'RM RM RM'])
const OUTLET_TYPES = new Set(['single', 'multi', 'online'])
const STATUSES = new Set(['active', 'pending', 'inactive'])

function asString(value: unknown, field: string): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new AppError(400, `${field} must be a string`)
  return value.trim()
}

function asOptionalStringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new AppError(400, `${field} must be an array`)
  return value
    .map((item, index) => {
      if (typeof item !== 'string') {
        throw new AppError(400, `${field}[${index}] must be a string`)
      }
      return item.trim()
    })
    .filter(Boolean)
}

function asBoolean(value: unknown, field: string, fallback = false): boolean {
  if (value === undefined || value === null) return fallback
  if (typeof value !== 'boolean') throw new AppError(400, `${field} must be a boolean`)
  return value
}

export function parseMerchantWriteBody(body: unknown, partial = false): MerchantWriteInput {
  if (!body || typeof body !== 'object') {
    throw new AppError(400, 'Invalid request body')
  }

  const raw = body as Record<string, unknown>

  if (!partial) {
    const businessName = asString(raw.businessName, 'businessName')
    const category = asString(raw.category, 'category')
    if (!businessName) throw new AppError(400, 'businessName is required')
    if (!category) throw new AppError(400, 'category is required')
  } else if ('businessName' in raw) {
    const businessName = asString(raw.businessName, 'businessName')
    if (!businessName) throw new AppError(400, 'businessName cannot be empty')
  } else if ('category' in raw) {
    const category = asString(raw.category, 'category')
    if (!category) throw new AppError(400, 'category cannot be empty')
  }

  const priceRange =
    raw.priceRange === undefined ? undefined : asString(raw.priceRange, 'priceRange')
  if (priceRange && !PRICE_RANGES.has(priceRange)) {
    throw new AppError(400, 'Invalid priceRange')
  }

  const outletType =
    raw.outletType === undefined ? undefined : asString(raw.outletType, 'outletType')
  if (outletType && !OUTLET_TYPES.has(outletType)) {
    throw new AppError(400, 'Invalid outletType')
  }

  const status = raw.status === undefined ? undefined : asString(raw.status, 'status')
  if (status && !STATUSES.has(status)) {
    throw new AppError(400, 'Invalid status')
  }

  const logoUrl =
    raw.logoUrl === null
      ? null
      : raw.logoUrl === undefined
        ? undefined
        : asString(raw.logoUrl, 'logoUrl') || null
  const coverUrl =
    raw.coverUrl === null
      ? null
      : raw.coverUrl === undefined
        ? undefined
        : asString(raw.coverUrl, 'coverUrl') || null

  const input: MerchantWriteInput = {
    businessName: partial
      ? ('businessName' in raw ? asString(raw.businessName, 'businessName') : '')
      : asString(raw.businessName, 'businessName'),
    category: partial
      ? ('category' in raw ? asString(raw.category, 'category') : '')
      : asString(raw.category, 'category'),
  }

  // For partial updates, omit empty required placeholders so service keeps existing values
  if (partial && !('businessName' in raw)) {
    delete (input as { businessName?: string }).businessName
  }
  if (partial && !('category' in raw)) {
    delete (input as { category?: string }).category
  }

  if ('legalName' in raw) input.legalName = asString(raw.legalName, 'legalName')
  if ('subCategories' in raw) {
    input.subCategories = asOptionalStringArray(raw.subCategories, 'subCategories')
  }
  if ('description' in raw) input.description = asString(raw.description, 'description')
  if ('registrationNo' in raw) {
    input.registrationNo = asString(raw.registrationNo, 'registrationNo')
  }
  if (priceRange !== undefined) {
    input.priceRange = priceRange as MerchantWriteInput['priceRange']
  }
  if ('phone' in raw) input.phone = asString(raw.phone, 'phone')
  if ('email' in raw) input.email = asString(raw.email, 'email')
  if ('whatsapp' in raw) input.whatsapp = asString(raw.whatsapp, 'whatsapp')
  if ('website' in raw) input.website = asString(raw.website, 'website')
  if ('city' in raw) input.city = asString(raw.city, 'city')
  if ('state' in raw) input.state = asString(raw.state, 'state')
  if ('address' in raw) input.address = asString(raw.address, 'address')
  if ('postcode' in raw) input.postcode = asString(raw.postcode, 'postcode')
  if ('latitude' in raw) input.latitude = asString(raw.latitude, 'latitude')
  if ('longitude' in raw) input.longitude = asString(raw.longitude, 'longitude')
  if (outletType !== undefined) {
    input.outletType = outletType as MerchantWriteInput['outletType']
  }
  if ('picName' in raw) input.picName = asString(raw.picName, 'picName')
  if ('hoursWeekday' in raw) input.hoursWeekday = asString(raw.hoursWeekday, 'hoursWeekday')
  if ('hoursWeekend' in raw) input.hoursWeekend = asString(raw.hoursWeekend, 'hoursWeekend')
  if ('hoursHoliday' in raw) input.hoursHoliday = asString(raw.hoursHoliday, 'hoursHoliday')
  if (logoUrl !== undefined) input.logoUrl = logoUrl
  if (coverUrl !== undefined) input.coverUrl = coverUrl
  if ('galleryUrls' in raw) {
    input.galleryUrls = asOptionalStringArray(raw.galleryUrls, 'galleryUrls')
  }
  if ('featured' in raw) input.featured = asBoolean(raw.featured, 'featured')
  if (status !== undefined) input.status = status as MerchantWriteInput['status']
  if ('offerSummary' in raw) input.offerSummary = asString(raw.offerSummary, 'offerSummary')
  if ('createdBy' in raw) input.createdBy = asString(raw.createdBy, 'createdBy')

  return input
}

export function parseStatusBody(body: unknown): 'active' | 'pending' | 'inactive' {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const status = (body as Record<string, unknown>).status
  if (typeof status !== 'string' || !STATUSES.has(status)) {
    throw new AppError(400, 'status must be active, pending, or inactive')
  }
  return status as 'active' | 'pending' | 'inactive'
}
