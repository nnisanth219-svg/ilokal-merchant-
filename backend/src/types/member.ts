export type MemberStatusValue =
  | 'active'
  | 'expired'
  | 'suspended'
  | 'inactive'
  | 'deleted'

export type MembershipPlanValue = 'Annual' | 'Monthly' | 'None'

export type JoinedFilterValue = 'any' | '7d' | '30d' | '90d'

export interface MemberPurchaseDto {
  id: string
  date: string
  description: string
  plan: string
  amountLabel: string
  status: 'Paid' | 'Failed' | 'Pending'
}

export interface MemberRedemptionDto {
  id: string
  date: string
  merchantName: string
  offerTitle: string
  status: 'Redeemed' | 'Cancelled'
}

export interface MemberReviewDto {
  id: string
  merchantName: string
  rating: number
  text: string
  date: string
}

export interface MemberDeviceDto {
  device: string
  lastActive: string
  appVersion: string
  platform: string
}

export interface MemberSubscriptionDto {
  plan: MembershipPlanValue
  status: Exclude<MemberStatusValue, 'deleted'>
  startDate: string
  validUntil: string
  paymentStatus: string
}

export interface MemberSupportNoteDto {
  id: string
  date: string
  note: string
  addedBy: string
}

export interface MemberDto {
  id: string
  memberCode: string
  fullName: string
  email: string
  phone: string
  city: string
  status: MemberStatusValue
  plan: MembershipPlanValue
  planLabel: string
  joinedAt: string
  expiresAt: string | null
  totalPurchases: number
  totalRedemptions: number
  reviewsCount: number
  purchases: MemberPurchaseDto[]
  redemptions: MemberRedemptionDto[]
  reviews: MemberReviewDto[]
  device: MemberDeviceDto
  subscription: MemberSubscriptionDto
  supportNotes: MemberSupportNoteDto[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface MemberListQuery {
  page: number
  pageSize: number
  search?: string
  status?: MemberStatusValue | 'all'
  plan?: MembershipPlanValue | 'all'
  joined?: JoinedFilterValue
  includeDeleted: boolean
  sortBy?: 'joinedAt' | 'fullName' | 'createdAt' | 'memberCode'
  sortOrder?: 'asc' | 'desc'
}

export interface MemberListResult {
  members: MemberDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    active: number
    expired: number
    suspended: number
    inactive: number
  }
}

export interface MemberWriteInput {
  fullName?: string
  email?: string
  phone?: string
  city?: string
  status?: Exclude<MemberStatusValue, 'deleted'>
  plan?: MembershipPlanValue
  joinedAt?: string
  expiresAt?: string | null
  deviceName?: string
  lastActiveAt?: string | null
  appVersion?: string
  platform?: string
  paymentStatus?: string
  purchases?: MemberPurchaseDto[]
  redemptions?: MemberRedemptionDto[]
  reviews?: MemberReviewDto[]
  supportNotes?: MemberSupportNoteDto[]
}
