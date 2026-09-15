export type DashboardDataSourceStatus = 'available' | 'unavailable'

export interface DashboardStats {
  activeMembers: number
  liveMerchants: number
  redemptions: number
  membershipRevenue: number
  renewalRate: number
  activeMembersTrend: string | null
  liveMerchantsTrend: string | null
  redemptionsTrend: string | null
  adminUsersTotal: number
  adminUsersActive: number
  merchantsTotal: number
  merchantsPending: number
  merchantsInactive: number
  dataSources: {
    activeMembers: DashboardDataSourceStatus
    liveMerchants: DashboardDataSourceStatus
    redemptions: DashboardDataSourceStatus
    membershipRevenue: DashboardDataSourceStatus
    adminUsers: DashboardDataSourceStatus
  }
}

export interface DashboardChartPoint {
  label: string
  value: number
  tone: 'blue' | 'navy' | 'red'
}

export interface DashboardChartData {
  rangeLabel: string
  points: DashboardChartPoint[]
  dataSource: DashboardDataSourceStatus
  message: string | null
}

export type AttentionTone = 'red' | 'yellow' | 'blue'

export interface DashboardActivityItem {
  id: string
  type: string
  title: string
  description: string
  createdAt: string
  href?: string
  tone?: AttentionTone
  boldPrefix?: string
  rest?: string
}

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiFailure {
  success: false
  message: string
}
