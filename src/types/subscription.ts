export type SubscriptionStatus = 'active' | 'expired' | 'suspended'
export type SubscriptionPlan = 'Monthly' | 'Annual'
export type BillingCycle = 'Monthly' | 'Annual'

export interface SubscriptionPayment {
  id: string
  reference: string
  paidAt: string
  amountLabel: string
  status: 'Paid' | 'Failed' | 'Pending'
}

export interface Subscription {
  id: string
  subscriptionCode: string
  memberId: string
  memberName: string
  memberEmail: string
  memberPhone: string
  memberCode: string
  plan: SubscriptionPlan
  billing: BillingCycle
  startDate: string
  expiryDate: string
  status: SubscriptionStatus
  payments: SubscriptionPayment[]
}

export const SUBSCRIPTION_STATUS_FILTERS: {
  value: SubscriptionStatus | 'all'
  label: string
}[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
]

export const SUBSCRIPTION_PLAN_FILTERS: {
  value: SubscriptionPlan | 'all'
  label: string
}[] = [
  { value: 'all', label: 'All' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Annual', label: 'Annual' },
]
