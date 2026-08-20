export type ReviewStatus = 'published' | 'pending' | 'flagged' | 'hidden'

export interface ReviewItem {
  id: string
  memberId: string
  memberName: string
  merchantId: string
  merchantName: string
  rating: number
  text: string
  submittedAt: string
  status: ReviewStatus
}

export const REVIEW_STATUS_FILTERS: {
  value: ReviewStatus | 'all'
  label: string
}[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'pending', label: 'Pending' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'hidden', label: 'Hidden' },
]

export const REVIEW_RATING_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
]
