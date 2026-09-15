export type ReviewStatusValue = 'published' | 'pending' | 'flagged' | 'hidden'

export type DateFilterValue = 'any' | '7d' | '30d' | '90d'

export interface ReviewDto {
  id: string
  memberId: string
  memberName: string
  merchantId: string
  merchantName: string
  rating: number
  text: string
  submittedAt: string
  status: ReviewStatusValue
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ReviewListQuery {
  page: number
  pageSize: number
  search?: string
  status?: ReviewStatusValue | 'all'
  rating?: number | 'all'
  memberId?: string
  merchantId?: string
  date?: DateFilterValue
  includeDeleted: boolean
  sortBy?: 'submittedAt' | 'createdAt' | 'rating'
  sortOrder?: 'asc' | 'desc'
}

export interface ReviewListResult {
  reviews: ReviewDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    averageRating: number
    fiveStar: number
    needsAttention: number
  }
  filterOptions: {
    merchants: { id: string; name: string }[]
  }
}

export interface ReviewWriteInput {
  memberId?: string
  merchantId?: string
  rating?: number
  text?: string
  submittedAt?: string
  status?: ReviewStatusValue
}
