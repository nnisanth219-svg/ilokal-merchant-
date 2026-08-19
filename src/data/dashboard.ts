export interface DashboardStats {
  activeMembers: number
  activeMembersTrend: string
  liveMerchants: number
  liveMerchantsTrend: string
  redemptions: number
  redemptionsTrend: string
  membershipRevenue: string
  renewalRate: number
}

export type ChartBarTone = 'blue' | 'navy' | 'red'

export interface ChartBar {
  id: string
  height: number
  tone: ChartBarTone
}

export type AttentionTone = 'red' | 'yellow' | 'blue'

export interface AttentionItem {
  id: string
  tone: AttentionTone
  boldPrefix: string
  rest: string
  href: string
}

export const dashboardStats: DashboardStats = {
  activeMembers: 4182,
  activeMembersTrend: '12.4% vs last month',
  liveMerchants: 318,
  liveMerchantsTrend: '9 added this week',
  redemptions: 11905,
  redemptionsTrend: '6.1% vs last month',
  membershipRevenue: 'RM 186,430',
  renewalRate: 74,
}

export const chartBars: ChartBar[] = [
  { id: 'd1', height: 38, tone: 'blue' },
  { id: 'd2', height: 46, tone: 'blue' },
  { id: 'd3', height: 42, tone: 'blue' },
  { id: 'd4', height: 62, tone: 'navy' },
  { id: 'd5', height: 48, tone: 'blue' },
  { id: 'd6', height: 70, tone: 'navy' },
  { id: 'd7', height: 92, tone: 'red' },
  { id: 'd8', height: 54, tone: 'blue' },
  { id: 'd9', height: 74, tone: 'navy' },
  { id: 'd10', height: 50, tone: 'blue' },
  { id: 'd11', height: 88, tone: 'red' },
  { id: 'd12', height: 66, tone: 'navy' },
  { id: 'd13', height: 44, tone: 'blue' },
]

export const attentionItems: AttentionItem[] = [
  {
    id: 'a1',
    tone: 'red',
    boldPrefix: '7 merchants',
    rest: ' pending approval — submitted in the last 48 hours',
    href: '/merchants',
  },
  {
    id: 'a2',
    tone: 'yellow',
    boldPrefix: '12 reviews',
    rest: ' flagged for moderation',
    href: '/reviews',
  },
  {
    id: 'a3',
    tone: 'yellow',
    boldPrefix: '34 memberships',
    rest: ' expiring within 7 days',
    href: '/subscriptions',
  },
  {
    id: 'a4',
    tone: 'blue',
    boldPrefix: '3 offers',
    rest: ' expire tomorrow — renew or archive',
    href: '/offers',
  },
]

export interface NavItem {
  id: string
  label: string
  path: string
}

export const sidebarNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { id: 'merchants', label: 'Merchants', path: '/merchants' },
  { id: 'offers', label: 'Offers', path: '/offers' },
  { id: 'members', label: 'Members', path: '/members' },
  { id: 'subscriptions', label: 'Subscriptions', path: '/subscriptions' },
  { id: 'redemptions', label: 'Redemptions', path: '/redemptions' },
  { id: 'reviews', label: 'Reviews', path: '/reviews' },
  { id: 'categories', label: 'Categories', path: '/categories' },
  { id: 'admin-users', label: 'Admin users', path: '/admin-users' },
  { id: 'settings', label: 'Settings', path: '/settings' },
  { id: 'audit-log', label: 'Audit log', path: '/audit-log' },
]
