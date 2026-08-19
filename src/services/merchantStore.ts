import { initialMerchants } from '../data/merchants'
import type {
  Merchant,
  MerchantFormValues,
  MerchantStatus,
  PublishStatus,
} from '../types/merchant'

type Listener = () => void

let merchants: Merchant[] = structuredClone(initialMerchants)
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

export function subscribeMerchants(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getMerchants(): Merchant[] {
  return merchants
}

export function getMerchantById(id: string): Merchant | undefined {
  return merchants.find((m) => m.id === id)
}

export function getLiveMerchantCount(): number {
  return merchants.filter((m) => m.status === 'active').length
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function nextMerchantCode(): string {
  const nums = merchants.map((m) => {
    const match = m.merchantCode.match(/MRC-(\d+)/)
    return match ? Number(match[1]) : 0
  })
  const next = Math.max(0, ...nums) + 1
  return `MRC-${String(next).padStart(4, '0')}`
}

function mapPublishStatus(status: PublishStatus): MerchantStatus {
  if (status === 'active') return 'active'
  if (status === 'inactive') return 'inactive'
  return 'pending'
}

export function emptyMerchantForm(): MerchantFormValues {
  return {
    businessName: 'Kedai Kopi Seri Wangi',
    legalName: 'Seri Wangi Enterprise',
    category: 'Food & Beverage',
    subCategories: 'Kopitiam, Halal, Breakfast',
    description:
      'Third-generation kopitiam serving white coffee, kaya toast and local breakfast.',
    registrationNo: 'SSM202301004521',
    priceRange: 'RM RM',
    publishStatus: 'pending',
    featured: false,
    address: 'Kampung Baru, Kuala Lumpur',
    postcode: '50300',
    latitude: '3.1612',
    longitude: '101.7068',
    outletType: 'single',
    logoUrl: null,
    coverUrl: null,
    galleryUrls: [],
    picName: 'Encik Rosli bin Ahmad',
    phone: '012-338 9021',
    email: 'seriwangi@gmail.com',
    whatsapp: '012-338 9021',
    hoursWeekday: '7:00 – 18:00',
    hoursWeekend: '7:00 – 15:00',
    hoursHoliday: 'Closed',
    offerSummary: '15% off total bill — members only',
  }
}

export function merchantToFormValues(merchant: Merchant): MerchantFormValues {
  return {
    businessName: merchant.businessName,
    legalName: merchant.legalName,
    category: merchant.category,
    subCategories: merchant.subCategories.join(', '),
    description: merchant.description,
    registrationNo: merchant.registrationNo,
    priceRange: merchant.priceRange,
    publishStatus:
      merchant.status === 'active'
        ? 'active'
        : merchant.status === 'inactive'
          ? 'inactive'
          : 'pending',
    featured: merchant.featured,
    address: merchant.address,
    postcode: merchant.postcode,
    latitude: merchant.latitude,
    longitude: merchant.longitude,
    outletType: merchant.outletType,
    logoUrl: merchant.logoUrl,
    coverUrl: merchant.coverUrl,
    galleryUrls: [...merchant.galleryUrls],
    picName: merchant.picName,
    phone: merchant.phone,
    email: merchant.email,
    whatsapp: merchant.whatsapp,
    hoursWeekday: merchant.hours.weekday,
    hoursWeekend: merchant.hours.weekend,
    hoursHoliday: merchant.hours.publicHoliday,
    offerSummary: merchant.offers[0]?.title ?? '',
  }
}

export function createMerchant(values: MerchantFormValues): Merchant {
  const now = new Date().toISOString()
  const merchant: Merchant = {
    id: `m-${Date.now()}`,
    merchantCode: nextMerchantCode(),
    businessName: values.businessName.trim(),
    legalName: values.legalName.trim(),
    category: values.category,
    subCategories: values.subCategories
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    description: values.description.trim(),
    registrationNo: values.registrationNo.trim(),
    priceRange: values.priceRange,
    phone: values.phone.trim(),
    email: values.email.trim(),
    whatsapp: values.whatsapp.trim() || values.phone.trim(),
    website: '',
    city: values.address.split(',').at(-2)?.trim() || values.address.trim() || '—',
    state: values.address.split(',').at(-1)?.trim() || '—',
    address: values.address.trim(),
    postcode: values.postcode.trim(),
    latitude: values.latitude.trim(),
    longitude: values.longitude.trim(),
    outletType: values.outletType,
    picName: values.picName.trim(),
    hours: {
      weekday: values.hoursWeekday,
      weekend: values.hoursWeekend,
      publicHoliday: values.hoursHoliday,
    },
    logoUrl: values.logoUrl,
    coverUrl: values.coverUrl,
    galleryUrls: [...values.galleryUrls],
    featured: values.featured,
    status: mapPublishStatus(values.publishStatus),
    offersCount: values.offerSummary.trim() ? 1 : 0,
    redeemedCount: 0,
    rating: 0,
    ratingsCount: 0,
    profileViews: 0,
    redeemed30d: 0,
    uniqueMembers: 0,
    membersReached: 0,
    slug: slugify(values.businessName) || 'new-merchant',
    createdBy: 'Aisyah R.',
    createdAt: now,
    updatedAt: now,
    offers: values.offerSummary.trim()
      ? [
          {
            id: `o-${Date.now()}`,
            title: values.offerSummary.trim(),
            details: 'Draft offer · configure later',
            endsAt: 'TBD',
            status: 'live',
          },
        ]
      : [],
    activities: [
      {
        id: `act-${Date.now()}`,
        dateLabel: new Date()
          .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
          .toUpperCase(),
        description: 'Merchant draft created',
        actor: 'Aisyah R.',
      },
    ],
  }

  merchants = [merchant, ...merchants]
  notify()
  return merchant
}

export function updateMerchant(id: string, values: MerchantFormValues): Merchant | undefined {
  const index = merchants.findIndex((m) => m.id === id)
  if (index < 0) return undefined

  const existing = merchants[index]
  const updated: Merchant = {
    ...existing,
    businessName: values.businessName.trim(),
    legalName: values.legalName.trim(),
    category: values.category,
    subCategories: values.subCategories
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    description: values.description.trim(),
    registrationNo: values.registrationNo.trim(),
    priceRange: values.priceRange,
    phone: values.phone.trim(),
    email: values.email.trim(),
    whatsapp: values.whatsapp.trim() || values.phone.trim(),
    address: values.address.trim(),
    postcode: values.postcode.trim(),
    latitude: values.latitude.trim(),
    longitude: values.longitude.trim(),
    outletType: values.outletType,
    picName: values.picName.trim(),
    hours: {
      weekday: values.hoursWeekday,
      weekend: values.hoursWeekend,
      publicHoliday: values.hoursHoliday,
    },
    logoUrl: values.logoUrl,
    coverUrl: values.coverUrl,
    galleryUrls: [...values.galleryUrls],
    featured: values.featured,
    status: mapPublishStatus(values.publishStatus),
    slug: slugify(values.businessName) || existing.slug,
    updatedAt: new Date().toISOString(),
  }

  merchants = [...merchants.slice(0, index), updated, ...merchants.slice(index + 1)]
  notify()
  return updated
}

export function setMerchantStatus(id: string, status: MerchantStatus): void {
  merchants = merchants.map((m) =>
    m.id === id ? { ...m, status, updatedAt: new Date().toISOString() } : m,
  )
  notify()
}

export function softDeleteMerchant(id: string): void {
  setMerchantStatus(id, 'deleted')
}

export function bulkSetStatus(ids: string[], status: MerchantStatus): void {
  const idSet = new Set(ids)
  merchants = merchants.map((m) =>
    idSet.has(m.id) ? { ...m, status, updatedAt: new Date().toISOString() } : m,
  )
  notify()
}

export function bulkSoftDelete(ids: string[]): void {
  bulkSetStatus(ids, 'deleted')
}

export function bulkChangeCategory(ids: string[], category: string): void {
  const idSet = new Set(ids)
  merchants = merchants.map((m) =>
    idSet.has(m.id) ? { ...m, category, updatedAt: new Date().toISOString() } : m,
  )
  notify()
}
