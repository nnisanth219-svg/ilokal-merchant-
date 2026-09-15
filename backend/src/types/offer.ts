export type OfferStatusValue = 'live' | 'scheduled' | 'draft' | 'expired' | 'paused' | 'deleted'

export type OfferTypeValue =
  | 'percentage'
  | 'fixed'
  | 'free_item'
  | 'set_price'
  | 'other'
  | 'bogo'
  | 'free_gift'
  | 'member_pricing'
  | 'voucher'

export interface OfferDto {
  id: string
  offerCode: string
  title: string
  description: string
  termsAndConditions: string
  merchantId: string
  merchantName: string
  category: string
  offerType: OfferTypeValue
  benefitLabel: string
  benefitValue: string
  eligibility: string
  validFrom: string
  validTo: string
  validityLabel: string
  redemptionInstructions: string
  redemptionLimit: string
  maxRedemptions: number | null
  maxRedemptionsPerMember: number | null
  imageUrl: string | null
  redeemedCount: number
  status: OfferStatusValue
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface OfferListQuery {
  page: number
  pageSize: number
  search?: string
  status?: OfferStatusValue | 'all'
  merchantId?: string
  category?: string
  offerType?: OfferTypeValue | 'all'
  date?: 'any' | '30d' | '90d' | 'year'
  includeDeleted: boolean
  sortBy?: 'createdAt' | 'title' | 'validTo' | 'redeemedCount'
  sortOrder?: 'asc' | 'desc'
}

export interface OfferListResult {
  offers: OfferDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    live: number
    scheduled: number
    expired: number
    usageTotal: number
  }
}

export interface OfferWriteInput {
  merchantId?: string
  title?: string
  description?: string
  termsAndConditions?: string
  offerType?: OfferTypeValue
  benefitValue?: string
  eligibility?: string
  validFrom?: string
  validTo?: string
  redemptionInstructions?: string
  redemptionLimit?: string
  maxRedemptions?: number | null
  maxRedemptionsPerMember?: number | null
  imageUrl?: string | null
  status?: Exclude<OfferStatusValue, 'deleted'>
}
