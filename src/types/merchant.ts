export type MerchantStatus = 'active' | 'pending' | 'inactive' | 'deleted'

export type MerchantPriceRange = 'RM' | 'RM RM' | 'RM RM RM'

export type MerchantOutletType = 'single' | 'multi' | 'online'

export type PublishStatus = 'active' | 'inactive' | 'pending'

export interface MerchantOffer {
  id: string
  title: string
  details: string
  endsAt: string
  status: 'live' | 'expired'
}

export interface MerchantActivity {
  id: string
  dateLabel: string
  description: string
  actor: string
}

export interface MerchantHours {
  weekday: string
  weekend: string
  publicHoliday: string
}

export interface Merchant {
  id: string
  merchantCode: string
  businessName: string
  legalName: string
  category: string
  subCategories: string[]
  description: string
  registrationNo: string
  priceRange: MerchantPriceRange
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
  outletType: MerchantOutletType
  picName: string
  hours: MerchantHours
  logoUrl: string | null
  coverUrl: string | null
  galleryUrls: string[]
  featured: boolean
  status: MerchantStatus
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
  offers: MerchantOffer[]
  activities: MerchantActivity[]
}

export type MerchantWizardStep =
  | 'business'
  | 'location'
  | 'media'
  | 'contact'
  | 'publish'

export interface MerchantFormValues {
  businessName: string
  legalName: string
  category: string
  subCategories: string
  description: string
  registrationNo: string
  priceRange: MerchantPriceRange
  publishStatus: PublishStatus
  featured: boolean
  address: string
  postcode: string
  latitude: string
  longitude: string
  outletType: MerchantOutletType
  logoUrl: string | null
  coverUrl: string | null
  galleryUrls: string[]
  picName: string
  phone: string
  email: string
  whatsapp: string
  hoursWeekday: string
  hoursWeekend: string
  hoursHoliday: string
  offerSummary: string
}

export type MerchantFormErrors = Partial<Record<keyof MerchantFormValues, string>>
