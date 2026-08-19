import { prisma } from '../lib/prisma.js'
import type {
  DashboardActivityItem,
  DashboardChartResponse,
  DashboardStats,
} from '../types/dashboard.js'

const UNAVAILABLE_DOMAIN_MESSAGE =
  'Required business tables (members, merchants, offers, redemptions, memberships, reviews, audit) are not present in the current PostgreSQL schema.'

export async function getDashboardStats(): Promise<DashboardStats> {
  const [adminUsersTotal, adminUsersActive] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
  ])

  return {
    activeMembers: 0,
    liveMerchants: 0,
    redemptions: 0,
    membershipRevenue: 0,
    renewalRate: 0,
    activeMembersTrend: null,
    liveMerchantsTrend: null,
    redemptionsTrend: null,
    adminUsersTotal,
    adminUsersActive,
    dataSources: {
      activeMembers: 'unavailable',
      liveMerchants: 'unavailable',
      redemptions: 'unavailable',
      membershipRevenue: 'unavailable',
      adminUsers: 'available',
    },
  }
}

export async function getDashboardRedemptionsChart(): Promise<DashboardChartResponse> {
  return {
    rangeLabel: 'DAILY · 30D',
    points: [],
    dataSource: 'unavailable',
    message: UNAVAILABLE_DOMAIN_MESSAGE,
  }
}

export async function getDashboardActivity(limit = 10): Promise<DashboardActivityItem[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 20)

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      role: { select: { name: true } },
    },
  })

  const inactiveCount = await prisma.user.count({ where: { isActive: false } })

  const attentionItems: DashboardActivityItem[] = []

  if (inactiveCount > 0) {
    attentionItems.push({
      id: 'inactive-admins',
      type: 'admin_user',
      title: 'Inactive admin accounts',
      description: `${inactiveCount} admin account(s) are currently inactive`,
      createdAt: new Date().toISOString(),
      href: '/admin-users',
      tone: 'yellow',
      boldPrefix: `${inactiveCount} admin account${inactiveCount === 1 ? '' : 's'}`,
      rest: ' currently inactive — review access',
    })
  }

  const userEvents: DashboardActivityItem[] = recentUsers.map((user) => ({
    id: user.id,
    type: 'admin_user',
    title: 'Admin user registered',
    description: `${user.name} (${user.email}) · ${user.role.name}`,
    createdAt: user.createdAt.toISOString(),
    href: '/admin-users',
    tone: user.isActive ? 'blue' : 'yellow',
    boldPrefix: user.name,
    rest: ` registered as ${user.role.name.replace(/_/g, ' ')}`,
  }))

  return [...attentionItems, ...userEvents].slice(0, safeLimit)
}
