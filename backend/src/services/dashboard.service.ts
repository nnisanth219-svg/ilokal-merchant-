import { prisma } from '../lib/prisma.js'
import type {
  DashboardActivityItem,
  DashboardChartPoint,
  DashboardChartResponse,
  DashboardStats,
} from '../types/dashboard.js'

const notDeleted = { deletedAt: null } as const

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const [
    adminUsersTotal,
    adminUsersActive,
    merchantsTotal,
    liveMerchants,
    merchantsPending,
    merchantsInactive,
    activeMembers,
    membersTotal,
    membershipRevenueAgg,
    activeSubscriptions,
    expiredSubscriptions,
    redemptionsTotal,
    redemptionsThisMonth,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, status: 'active', isActive: true } }),
    prisma.merchant.count({ where: notDeleted }),
    prisma.merchant.count({ where: { ...notDeleted, status: 'active' } }),
    prisma.merchant.count({ where: { ...notDeleted, status: 'pending' } }),
    prisma.merchant.count({ where: { ...notDeleted, status: 'inactive' } }),
    prisma.member.count({ where: { ...notDeleted, status: 'active' } }),
    prisma.member.count({ where: notDeleted }),
    prisma.subscription.aggregate({
      where: { status: 'active' },
      _sum: { amount: true },
    }),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({ where: { status: 'expired' } }),
    prisma.redemption.count({ where: { status: 'successful' } }),
    prisma.redemption.count({
      where: { status: 'successful', redeemedAt: { gte: monthStart } },
    }),
  ])

  const liveMerchantsTrend =
    merchantsPending > 0
      ? `${merchantsPending} pending approval`
      : `${merchantsTotal} total merchants`

  const membershipRevenue = membershipRevenueAgg._sum.amount ?? 0
  const renewalDenom = activeSubscriptions + expiredSubscriptions
  const renewalRate =
    renewalDenom > 0 ? Math.round((activeSubscriptions / renewalDenom) * 1000) / 10 : 0

  const activeMembersTrend =
    membersTotal > 0 ? `${membersTotal} total members` : null

  const redemptionsTrend =
    redemptionsThisMonth > 0
      ? `${redemptionsThisMonth} this month`
      : `${redemptionsTotal} successful`

  return {
    activeMembers,
    liveMerchants,
    redemptions: redemptionsTotal,
    membershipRevenue,
    renewalRate,
    activeMembersTrend,
    liveMerchantsTrend,
    redemptionsTrend,
    adminUsersTotal,
    adminUsersActive,
    merchantsTotal,
    merchantsPending,
    merchantsInactive,
    dataSources: {
      activeMembers: 'available',
      liveMerchants: 'available',
      redemptions: 'available',
      membershipRevenue: 'available',
      adminUsers: 'available',
    },
  }
}

export async function getDashboardRedemptionsChart(): Promise<DashboardChartResponse> {
  const now = new Date()
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29),
  )

  const [redemptions, newMembers] = await Promise.all([
    prisma.redemption.findMany({
      where: { redeemedAt: { gte: start }, status: 'successful' },
      select: { redeemedAt: true },
    }),
    prisma.member.findMany({
      where: { createdAt: { gte: start }, deletedAt: null },
      select: { createdAt: true },
    }),
  ])

  const dayKeys: string[] = []
  const redemptionCounts = new Map<string, number>()
  const memberCounts = new Map<string, number>()

  for (let i = 0; i < 30; i += 1) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    dayKeys.push(key)
    redemptionCounts.set(key, 0)
    memberCounts.set(key, 0)
  }

  for (const row of redemptions) {
    const key = row.redeemedAt.toISOString().slice(0, 10)
    if (redemptionCounts.has(key)) {
      redemptionCounts.set(key, (redemptionCounts.get(key) ?? 0) + 1)
    }
  }

  for (const row of newMembers) {
    const key = row.createdAt.toISOString().slice(0, 10)
    if (memberCounts.has(key)) {
      memberCounts.set(key, (memberCounts.get(key) ?? 0) + 1)
    }
  }

  let peakKey = dayKeys[0]
  let peakValue = 0
  for (const key of dayKeys) {
    const value = redemptionCounts.get(key) ?? 0
    if (value > peakValue) {
      peakValue = value
      peakKey = key
    }
  }

  const points: DashboardChartPoint[] = dayKeys.map((key) => {
    const redemptionValue = redemptionCounts.get(key) ?? 0
    const memberValue = memberCounts.get(key) ?? 0
    const day = Number.parseInt(key.slice(8, 10), 10)
    const label = String(day)

    if (key === peakKey && peakValue > 0) {
      return { label, value: redemptionValue, tone: 'red' }
    }
    if (memberValue > redemptionValue) {
      return { label, value: memberValue, tone: 'navy' }
    }
    return { label, value: redemptionValue, tone: 'blue' }
  })

  return {
    rangeLabel: 'DAILY · 30D',
    points,
    dataSource: 'available',
    message: null,
  }
}

export async function getDashboardActivity(limit = 10): Promise<DashboardActivityItem[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 20)

  const [
    recentUsers,
    inactiveCount,
    pendingMerchants,
    recentRedemptions,
    attentionReviews,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        status: true,
        createdAt: true,
        role: { select: { name: true } },
      },
    }),
    prisma.user.count({ where: { deletedAt: null, status: { not: 'active' } } }),
    prisma.merchant.count({ where: { ...notDeleted, status: 'pending' } }),
    prisma.redemption.findMany({
      orderBy: { redeemedAt: 'desc' },
      take: 5,
      include: {
        member: { select: { fullName: true } },
        merchant: { select: { businessName: true } },
      },
    }),
    prisma.review.count({
      where: { deletedAt: null, status: { in: ['pending', 'flagged'] } },
    }),
  ])

  const attentionItems: DashboardActivityItem[] = []

  if (pendingMerchants > 0) {
    attentionItems.push({
      id: 'pending-merchants',
      type: 'merchant',
      title: 'Merchants pending approval',
      description: `${pendingMerchants} merchant(s) awaiting review`,
      createdAt: new Date().toISOString(),
      href: '/merchants',
      tone: 'red',
      boldPrefix: `${pendingMerchants} merchant${pendingMerchants === 1 ? '' : 's'}`,
      rest: ' pending approval — review merchant list',
    })
  }

  if (attentionReviews > 0) {
    attentionItems.push({
      id: 'reviews-attention',
      type: 'review',
      title: 'Reviews need attention',
      description: `${attentionReviews} review(s) pending or flagged`,
      createdAt: new Date().toISOString(),
      href: '/reviews',
      tone: 'yellow',
      boldPrefix: `${attentionReviews} review${attentionReviews === 1 ? '' : 's'}`,
      rest: ' pending or flagged — moderate reviews',
    })
  }

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

  const redemptionEvents: DashboardActivityItem[] = recentRedemptions.map((row) => ({
    id: `redemption-${row.id}`,
    type: 'redemption',
    title: 'Offer redeemed',
    description: `${row.member.fullName} at ${row.merchant.businessName}`,
    createdAt: row.redeemedAt.toISOString(),
    href: '/redemptions',
    tone: row.status === 'successful' ? 'blue' : 'red',
    boldPrefix: row.member.fullName,
    rest: ` redeemed at ${row.merchant.businessName}`,
  }))

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

  return [...attentionItems, ...redemptionEvents, ...userEvents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, safeLimit)
}
