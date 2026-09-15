export type RedemptionStatusValue = 'successful' | 'failed' | 'cancelled'

export type DateFilterValue = 'any' | '7d' | '30d' | '90d'

export interface RedemptionActivityDto {
  id: string
  dateLabel: string
  description: string
}

export interface RedemptionDto {
  id: string
  redemptionCode: string
  memberId: string
  memberName: string
  merchantId: string
  merchantName: string
  offerId: string
  offerTitle: string
  redeemedAt: string
  status: RedemptionStatusValue
  method: string
  verificationStatus: string
  activity: RedemptionActivityDto[]
  createdAt: string
  updatedAt: string
}

export interface RedemptionListQuery {
  page: number
  pageSize: number
  search?: string
  status?: RedemptionStatusValue | 'all'
  memberId?: string
  merchantId?: string
  offerId?: string
  date?: DateFilterValue
  sortBy?: 'redeemedAt' | 'createdAt' | 'redemptionCode'
  sortOrder?: 'asc' | 'desc'
}

export interface RedemptionListResult {
  redemptions: RedemptionDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    today: number
    thisMonth: number
    successful: number
  }
  filterOptions: {
    members: { id: string; name: string }[]
    merchants: { id: string; name: string }[]
    offers: { id: string; title: string }[]
  }
}

export interface RedemptionWriteInput {
  memberId?: string
  merchantId?: string
  offerId?: string
  redeemedAt?: string
  status?: RedemptionStatusValue
  method?: string
  verificationStatus?: string
  activity?: RedemptionActivityDto[]
}
