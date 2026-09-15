import type { OfferStatus, OfferType } from '../types/offer'

export const OFFER_STATUS_FILTERS: { value: OfferStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
  { value: 'paused', label: 'Paused' },
  { value: 'deleted', label: 'Deleted' },
]

export const OFFER_TYPE_FILTERS: { value: OfferType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'percentage', label: 'Percentage discount' },
  { value: 'fixed', label: 'Fixed discount' },
  { value: 'free_item', label: 'Free item' },
  { value: 'set_price', label: 'Set price' },
  { value: 'bogo', label: 'Buy one get one free' },
  { value: 'free_gift', label: 'Free gift' },
  { value: 'member_pricing', label: 'Member pricing' },
  { value: 'voucher', label: 'Voucher' },
  { value: 'other', label: 'Other' },
]

export const OFFER_CATEGORIES = [
  'Food & Beverage',
  'Retail & Crafts',
  'Fitness',
  'Beauty & Wellness',
  'Services',
  'Education',
] as const
