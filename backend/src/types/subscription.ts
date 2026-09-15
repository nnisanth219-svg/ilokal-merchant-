export type SubscriptionStatusValue = 'active' | 'expired' | 'suspended'

export type SubscriptionPlanValue = 'Monthly' | 'Annual'

export type BillingCycleValue = 'Monthly' | 'Annual'

export type ExpiryFilterValue = 'any' | '7d' | '30d' | '90d'

export interface SubscriptionPaymentDto {
  id: string
  reference: string
  paidAt: string
  amountLabel: string
  status: 'Paid' | 'Failed' | 'Pending'
}

export interface SubscriptionDto {
  id: string
  subscriptionCode: string
  memberId: string
  memberName: string
  memberEmail: string
  memberPhone: string
  memberCode: string
  plan: SubscriptionPlanValue
  billing: BillingCycleValue
  startDate: string
  expiryDate: string
  status: SubscriptionStatusValue
  amount: number
  currency: string
  payments: SubscriptionPaymentDto[]
  createdAt: string
  updatedAt: string
}

export interface SubscriptionListQuery {
  page: number
  pageSize: number
  search?: string
  status?: SubscriptionStatusValue | 'all'
  plan?: SubscriptionPlanValue | 'all'
  billing?: BillingCycleValue | 'all'
  expiry?: ExpiryFilterValue
  memberId?: string
  sortBy?: 'createdAt' | 'expiryDate' | 'startDate' | 'subscriptionCode'
  sortOrder?: 'asc' | 'desc'
}

export interface SubscriptionListResult {
  subscriptions: SubscriptionDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    active: number
    expiringSoon: number
    expired: number
  }
}

export interface SubscriptionWriteInput {
  memberId?: string
  plan?: SubscriptionPlanValue
  billing?: BillingCycleValue
  startDate?: string
  expiryDate?: string
  status?: SubscriptionStatusValue
  amount?: number
  currency?: string
  payments?: SubscriptionPaymentDto[]
}
