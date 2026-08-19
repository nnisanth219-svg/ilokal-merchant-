export type OfferStatus = 'live' | 'scheduled' | 'draft' | 'expired' | 'paused'

export type OfferType =
  | 'percentage'
  | 'fixed'
  | 'free_item'
  | 'set_price'
  | 'other'

export interface Offer {
  id: string
  offerCode: string
  title: string
  description: string
  merchantId: string
  merchantName: string
  category: string
  offerType: OfferType
  benefitLabel: string
  benefitValue: string
  eligibility: string
  validFrom: string
  validTo: string
  validityLabel: string
  redemptionLimit: string
  redeemedCount: number
  status: OfferStatus
  createdAt: string
  updatedAt: string
}

export interface OfferFormValues {
  merchantId: string
  title: string
  description: string
  offerType: OfferType
  benefitValue: string
  eligibility: string
  validFrom: string
  validTo: string
  redemptionLimit: string
  status: OfferStatus
}

export type OfferFormErrors = Partial<Record<keyof OfferFormValues, string>>
