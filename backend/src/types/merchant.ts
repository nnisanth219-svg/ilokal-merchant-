export type MerchantStatusValue = 'active' | 'pending' | 'inactive' | 'deleted'
export type MerchantOutletTypeValue = 'single' | 'multi' | 'online'
export type MerchantPriceRangeValue = 'RM' | 'RM RM' | 'RM RM RM'

export interface MerchantHoursDto {
  weekday: string
  weekend: string
  publicHoliday: string
}

export interface MerchantOfferDto {
  id: string
  title: string
  details: string
  endsAt: string
  status: 'live' | 'expired'
}

export interface MerchantActivityDto {
  id: string
  dateLabel: string
  description: string
  actor: string
}

export interface MerchantDto {
  id: string
  merchantCode: string
  businessName: string
  legalName: string
  category: string
  subCategories: string[]
  description: string
  registrationNo: string
  priceRange: MerchantPriceRangeValue
  phone: string
  email: string
  whatsapp: string
  website: string
  city: string
  state: string
  address: string
  postcode: string
  latitude: string
  longitude: string
  outletType: MerchantOutletTypeValue
  picName: string
  hours: MerchantHoursDto
  logoUrl: string | null
  coverUrl: string | null
  galleryUrls: string[]
  featured: boolean
  status: MerchantStatusValue
  offersCount: number
  redeemedCount: number
  rating: number
  ratingsCount: number
  profileViews: number
  redeemed30d: number
  uniqueMembers: number
  membersReached: number
  slug: string
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  offers: MerchantOfferDto[]
  activities: MerchantActivityDto[]
}

export interface MerchantListQuery {
  page: number
  pageSize: number
  search?: string
  status?: MerchantStatusValue | 'all'
  category?: string
  state?: string
  added?: 'any' | '7d' | '30d' | '90d'
  includeDeleted: boolean
}

export interface MerchantListResult {
  merchants: MerchantDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  liveCount: number
}

export interface MerchantWriteInput {
  businessName?: string
  legalName?: string
  category?: string
  subCategories?: string[]
  description?: string
  registrationNo?: string
  priceRange?: MerchantPriceRangeValue
  phone?: string
  email?: string
  whatsapp?: string
  website?: string
  city?: string
  state?: string
  address?: string
  postcode?: string
  latitude?: string
  longitude?: string
  outletType?: MerchantOutletTypeValue
  picName?: string
  hoursWeekday?: string
  hoursWeekend?: string
  hoursHoliday?: string
  logoUrl?: string | null
  coverUrl?: string | null
  galleryUrls?: string[]
  featured?: boolean
  status?: 'active' | 'pending' | 'inactive'
  offerSummary?: string
  createdBy?: string
}
