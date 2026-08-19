import { initialOffers } from '../data/offers'
import type { Offer, OfferFormValues, OfferStatus } from '../types/offer'

type Listener = () => void

let offers: Offer[] = structuredClone(initialOffers)
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

export function subscribeOffers(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getOffers(): Offer[] {
  return offers
}

export function getOfferById(id: string): Offer | undefined {
  return offers.find((o) => o.id === id)
}

export function getOffersByMerchantId(merchantId: string): Offer[] {
  return offers.filter((o) => o.merchantId === merchantId)
}

function nextOfferCode(): string {
  const nums = offers.map((o) => {
    const match = o.offerCode.match(/OFR-(\d+)/)
    return match ? Number(match[1]) : 0
  })
  const next = Math.max(0, ...nums) + 1
  return `OFR-${String(next).padStart(4, '0')}`
}

function formatValidity(from: string, to: string): string {
  const fmt = (value: string) => {
    const date = new Date(`${value}T00:00:00`)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }
  return `${fmt(from)} – ${fmt(to)}`
}

function benefitLabel(type: OfferFormValues['offerType'], value: string): string {
  if (type === 'percentage') return `${value} discount`
  if (type === 'free_item') return 'Free item'
  if (type === 'set_price') return value
  if (type === 'fixed') return `${value} off`
  return value
}

export function emptyOfferForm(merchantId = 'm-0148'): OfferFormValues {
  return {
    merchantId,
    title: '15% Off Total Bill',
    description: 'Members receive 15% off their total dine-in bill.',
    offerType: 'percentage',
    benefitValue: '15%',
    eligibility: 'iLokal members only',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    redemptionLimit: '1 per member per day',
    status: 'live',
  }
}

export function offerToFormValues(offer: Offer): OfferFormValues {
  return {
    merchantId: offer.merchantId,
    title: offer.title,
    description: offer.description,
    offerType: offer.offerType,
    benefitValue: offer.benefitValue,
    eligibility: offer.eligibility,
    validFrom: offer.validFrom,
    validTo: offer.validTo,
    redemptionLimit: offer.redemptionLimit,
    status: offer.status,
  }
}

const MERCHANT_LOOKUP: Record<string, { name: string; category: string }> = {
  'm-0148': { name: 'Kedai Kopi Seri Wangi', category: 'Food & Beverage' },
  'm-0203': { name: 'Batik Warisan Gallery', category: 'Retail & Crafts' },
  'm-0217': { name: 'Ipoh White Coffee Co.', category: 'Food & Beverage' },
  'm-0091': { name: 'Melaka Nyonya Kitchen', category: 'Food & Beverage' },
  'm-0176': { name: 'JB Sports Hub', category: 'Fitness' },
}

export function createOffer(values: OfferFormValues): Offer {
  const now = new Date().toISOString()
  const merchant = MERCHANT_LOOKUP[values.merchantId] ?? {
    name: 'Unknown merchant',
    category: 'Services',
  }
  const offer: Offer = {
    id: `ofr-${Date.now()}`,
    offerCode: nextOfferCode(),
    title: values.title.trim(),
    description: values.description.trim(),
    merchantId: values.merchantId,
    merchantName: merchant.name,
    category: merchant.category,
    offerType: values.offerType,
    benefitLabel: benefitLabel(values.offerType, values.benefitValue.trim()),
    benefitValue: values.benefitValue.trim(),
    eligibility: values.eligibility.trim(),
    validFrom: values.validFrom,
    validTo: values.validTo,
    validityLabel: formatValidity(values.validFrom, values.validTo),
    redemptionLimit: values.redemptionLimit.trim(),
    redeemedCount: 0,
    status: values.status,
    createdAt: now,
    updatedAt: now,
  }
  offers = [offer, ...offers]
  notify()
  return offer
}

export function updateOffer(id: string, values: OfferFormValues): Offer | undefined {
  const index = offers.findIndex((o) => o.id === id)
  if (index < 0) return undefined
  const existing = offers[index]
  const merchant = MERCHANT_LOOKUP[values.merchantId] ?? {
    name: existing.merchantName,
    category: existing.category,
  }
  const updated: Offer = {
    ...existing,
    title: values.title.trim(),
    description: values.description.trim(),
    merchantId: values.merchantId,
    merchantName: merchant.name,
    category: merchant.category,
    offerType: values.offerType,
    benefitLabel: benefitLabel(values.offerType, values.benefitValue.trim()),
    benefitValue: values.benefitValue.trim(),
    eligibility: values.eligibility.trim(),
    validFrom: values.validFrom,
    validTo: values.validTo,
    validityLabel: formatValidity(values.validFrom, values.validTo),
    redemptionLimit: values.redemptionLimit.trim(),
    status: values.status,
    updatedAt: new Date().toISOString(),
  }
  offers = [...offers.slice(0, index), updated, ...offers.slice(index + 1)]
  notify()
  return updated
}

export function setOfferStatus(id: string, status: OfferStatus): void {
  offers = offers.map((o) =>
    o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
  )
  notify()
}

export function deleteOffer(id: string): void {
  offers = offers.filter((o) => o.id !== id)
  notify()
}

export function duplicateOffer(id: string): Offer | undefined {
  const source = getOfferById(id)
  if (!source) return undefined
  const now = new Date().toISOString()
  const copy: Offer = {
    ...source,
    id: `ofr-${Date.now()}`,
    offerCode: nextOfferCode(),
    title: `${source.title} (Copy)`,
    status: 'draft',
    redeemedCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  offers = [copy, ...offers]
  notify()
  return copy
}

export function bulkSetOfferStatus(ids: string[], status: OfferStatus): void {
  const idSet = new Set(ids)
  offers = offers.map((o) =>
    idSet.has(o.id) ? { ...o, status, updatedAt: new Date().toISOString() } : o,
  )
  notify()
}

export function bulkDeleteOffers(ids: string[]): void {
  const idSet = new Set(ids)
  offers = offers.filter((o) => !idSet.has(o.id))
  notify()
}
