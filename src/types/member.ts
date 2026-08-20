export type MemberStatus = 'active' | 'expired' | 'suspended' | 'inactive'

export type MembershipPlan = 'Annual' | 'Monthly' | 'None'

export type JoinedFilter = 'any' | '7d' | '30d' | '90d'

export interface MemberPurchase {
  id: string
  date: string
  description: string
  plan: string
  amountLabel: string
  status: 'Paid' | 'Failed' | 'Pending'
}

export interface MemberRedemption {
  id: string
  date: string
  merchantName: string
  offerTitle: string
  status: 'Redeemed' | 'Cancelled'
}

export interface MemberReview {
  id: string
  merchantName: string
  rating: number
  text: string
  date: string
}

export interface MemberDeviceInfo {
  device: string
  lastActive: string
  appVersion: string
  platform: string
}

export interface MemberSubscriptionInfo {
  plan: MembershipPlan
  status: MemberStatus
  startDate: string
  validUntil: string
  paymentStatus: string
}

export interface MemberSupportNote {
  id: string
  date: string
  note: string
  addedBy: string
}

export interface Member {
  id: string
  memberCode: string
  fullName: string
  email: string
  phone: string
  city: string
  status: MemberStatus
  plan: MembershipPlan
  planLabel: string
  joinedAt: string
  expiresAt: string | null
  totalPurchases: number
  totalRedemptions: number
  reviewsCount: number
  purchases: MemberPurchase[]
  redemptions: MemberRedemption[]
  reviews: MemberReview[]
  device: MemberDeviceInfo
  subscription: MemberSubscriptionInfo
  supportNotes: MemberSupportNote[]
}

export const MEMBER_STATUS_FILTERS: { value: MemberStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
]

export const MEMBER_PLAN_FILTERS: { value: MembershipPlan | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Annual', label: 'Annual' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'None', label: 'None' },
]
