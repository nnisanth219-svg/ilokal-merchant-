export type RedemptionStatus = 'successful' | 'failed' | 'cancelled'

export interface Redemption {
  id: string
  redemptionCode: string
  memberId: string
  memberName: string
  merchantId: string
  merchantName: string
  offerId: string
  offerTitle: string
  redeemedAt: string
  status: RedemptionStatus
  method: string
  verificationStatus: string
  activity: { id: string; dateLabel: string; description: string }[]
}

export const REDEMPTION_STATUS_FILTERS: {
  value: RedemptionStatus | 'all'
  label: string
}[] = [
  { value: 'all', label: 'All' },
  { value: 'successful', label: 'Successful' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]
