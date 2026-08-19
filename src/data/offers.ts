import type { Offer, OfferStatus, OfferType } from '../types/offer'

export const OFFER_STATUS_FILTERS: { value: OfferStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
  { value: 'paused', label: 'Paused' },
]

export const OFFER_TYPE_FILTERS: { value: OfferType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'percentage', label: 'Percentage discount' },
  { value: 'fixed', label: 'Fixed discount' },
  { value: 'free_item', label: 'Free item' },
  { value: 'set_price', label: 'Set price' },
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

const featuredOffers: Offer[] = [
  {
    id: 'ofr-0108',
    offerCode: 'OFR-0108',
    title: '15% Off Total Bill',
    description: 'Members receive 15% off their total dine-in bill.',
    merchantId: 'm-0148',
    merchantName: 'Kedai Kopi Seri Wangi',
    category: 'Food & Beverage',
    offerType: 'percentage',
    benefitLabel: '15% discount',
    benefitValue: '15%',
    eligibility: 'iLokal members only',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    validityLabel: '01 Jan 2026 – 31 Dec 2026',
    redemptionLimit: '1 per member per day',
    redeemedCount: 312,
    status: 'live',
    createdAt: '2025-12-15T08:00:00.000Z',
    updatedAt: '2026-08-11T10:00:00.000Z',
  },
  {
    id: 'ofr-0109',
    offerCode: 'OFR-0109',
    title: 'Free Kaya Toast with Coffee',
    description: 'One free kaya toast with any coffee purchase.',
    merchantId: 'm-0148',
    merchantName: 'Kedai Kopi Seri Wangi',
    category: 'Food & Beverage',
    offerType: 'free_item',
    benefitLabel: 'Free item',
    benefitValue: 'Free kaya toast',
    eligibility: 'iLokal members only · 8am–11am',
    validFrom: '2026-01-01',
    validTo: '2026-09-30',
    validityLabel: '01 Jan 2026 – 30 Sep 2026',
    redemptionLimit: '1 per member per day',
    redeemedCount: 184,
    status: 'live',
    createdAt: '2025-12-20T09:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z',
  },
  {
    id: 'ofr-0110',
    offerCode: 'OFR-0110',
    title: 'Raya Set RM18',
    description: 'Seasonal Raya set meal at RM18 (usual RM26).',
    merchantId: 'm-0148',
    merchantName: 'Kedai Kopi Seri Wangi',
    category: 'Food & Beverage',
    offerType: 'set_price',
    benefitLabel: 'RM18 set',
    benefitValue: 'RM18',
    eligibility: 'iLokal members only · limit 200 redemptions',
    validFrom: '2026-03-01',
    validTo: '2026-04-20',
    validityLabel: '01 Mar 2026 – 20 Apr 2026',
    redemptionLimit: 'Limit 200 redemptions',
    redeemedCount: 200,
    status: 'expired',
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-04-21T08:00:00.000Z',
  },
  {
    id: 'ofr-0111',
    offerCode: 'OFR-0111',
    title: '20% Off Sports Membership',
    description: 'Members get 20% off monthly sports membership fees.',
    merchantId: 'm-0176',
    merchantName: 'JB Sports Hub',
    category: 'Fitness',
    offerType: 'percentage',
    benefitLabel: '20% discount',
    benefitValue: '20%',
    eligibility: 'iLokal members only',
    validFrom: '2026-08-15',
    validTo: '2026-12-31',
    validityLabel: '15 Aug 2026 – 31 Dec 2026',
    redemptionLimit: '1 per member per month',
    redeemedCount: 48,
    status: 'scheduled',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'ofr-0112',
    offerCode: 'OFR-0112',
    title: 'Weekend Batik Special',
    description: '10% off selected batik scarves every weekend.',
    merchantId: 'm-0203',
    merchantName: 'Batik Warisan Gallery',
    category: 'Retail & Crafts',
    offerType: 'percentage',
    benefitLabel: '10% discount',
    benefitValue: '10%',
    eligibility: 'iLokal members only · weekends',
    validFrom: '2026-08-01',
    validTo: '2026-11-30',
    validityLabel: '01 Aug 2026 – 30 Nov 2026',
    redemptionLimit: '2 per member per week',
    redeemedCount: 96,
    status: 'live',
    createdAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-08-05T11:00:00.000Z',
  },
]

const EXTRA_TITLES = [
  'Member Lunch Special',
  'Happy Hour Discount',
  'Weekend Bundle',
  'Loyalty Freebie',
  'Seasonal Promo',
  'Morning Deal',
  'Family Set Offer',
  'Flash Redemption',
] as const

const EXTRA_MERCHANTS = [
  { id: 'm-0148', name: 'Kedai Kopi Seri Wangi', category: 'Food & Beverage' },
  { id: 'm-0203', name: 'Batik Warisan Gallery', category: 'Retail & Crafts' },
  { id: 'm-0217', name: 'Ipoh White Coffee Co.', category: 'Food & Beverage' },
  { id: 'm-0091', name: 'Melaka Nyonya Kitchen', category: 'Food & Beverage' },
  { id: 'm-0176', name: 'JB Sports Hub', category: 'Fitness' },
] as const

function buildExtraOffers(): Offer[] {
  const extras: Offer[] = []
  const statusPool: OfferStatus[] = [
    'live',
    'live',
    'live',
    'live',
    'scheduled',
    'expired',
    'draft',
    'paused',
  ]

  for (let i = 0; i < 123; i += 1) {
    const codeNum = 2000 + i
    const merchant = EXTRA_MERCHANTS[i % EXTRA_MERCHANTS.length]
    const status = statusPool[i % statusPool.length]
    const title = `${EXTRA_TITLES[i % EXTRA_TITLES.length]} ${i + 1}`
    const fromMonth = (i % 8) + 1
    const toMonth = Math.min(12, fromMonth + 3)
    extras.push({
      id: `ofr-gen-${codeNum}`,
      offerCode: `OFR-${String(codeNum).padStart(4, '0')}`,
      title,
      description: `${title} for iLokal members at ${merchant.name}.`,
      merchantId: merchant.id,
      merchantName: merchant.name,
      category: merchant.category,
      offerType: i % 2 === 0 ? 'percentage' : i % 3 === 0 ? 'free_item' : 'fixed',
      benefitLabel: i % 2 === 0 ? `${10 + (i % 15)}% discount` : 'Member perk',
      benefitValue: i % 2 === 0 ? `${10 + (i % 15)}%` : 'Special',
      eligibility: 'iLokal members only',
      validFrom: `2026-${String(fromMonth).padStart(2, '0')}-01`,
      validTo: `2026-${String(toMonth).padStart(2, '0')}-28`,
      validityLabel: `01 ${monthLabel(fromMonth)} 2026 – 28 ${monthLabel(toMonth)} 2026`,
      redemptionLimit: '1 per member per day',
      redeemedCount: status === 'scheduled' || status === 'draft' ? 0 : 20 + (i % 300),
      status,
      createdAt: new Date(Date.UTC(2026, i % 8, (i % 27) + 1)).toISOString(),
      updatedAt: new Date(Date.UTC(2026, 7, (i % 27) + 1)).toISOString(),
    })
  }
  return extras
}

function monthLabel(month: number): string {
  return [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][month - 1]
}

export const initialOffers: Offer[] = [...featuredOffers, ...buildExtraOffers()]

export const offerSummaryStats = {
  total: 128,
  live: 86,
  scheduled: 18,
  expired: 24,
}
