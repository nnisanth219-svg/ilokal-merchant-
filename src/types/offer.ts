export type OfferStatus = 'live' | 'scheduled' | 'draft' | 'expired' | 'paused' | 'deleted'

export type OfferType =
  | 'percentage'
  | 'fixed'
  | 'free_item'
  | 'set_price'
  | 'other'
  | 'bogo'
  | 'free_gift'
  | 'member_pricing'
  | 'voucher'

export interface Offer {
  id: string
  offerCode: string
  title: string
  description: string
  termsAndConditions?: string
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
  redemptionInstructions?: string
  redemptionLimit: string
  maxRedemptions?: number | null
  maxRedemptionsPerMember?: number | null
  imageUrl?: string | null
  redeemedCount: number
  status: OfferStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
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
