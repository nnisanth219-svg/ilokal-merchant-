import type {
  Prisma,
  Subscription,
  SubscriptionPlanType,
  SubscriptionStatus,
} from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type {
  SubscriptionDto,
  SubscriptionListQuery,
  SubscriptionListResult,
  SubscriptionPaymentDto,
  SubscriptionWriteInput,
} from '../types/subscription.js'
import { AppError } from '../utils/errors.js'

type SubscriptionWithMember = Subscription & {
  member: {
    id: string
    fullName: string
    email: string
    phone: string
    memberCode: string
  }
}

const memberSelect = {
  member: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      memberCode: true,
    },
  },
} as const

function toDateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseJsonArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value as T[]
}

function defaultAmount(plan: SubscriptionPlanType): number {
  return plan === 'Annual' ? 149 : 18.9
}

function amountLabel(plan: SubscriptionPlanType, amount: number): string {
  const value = amount > 0 ? amount : defaultAmount(plan)
  return `RM ${value.toFixed(2)}`
}

function toDto(row: SubscriptionWithMember): SubscriptionDto {
  return {
    id: row.id,
    subscriptionCode: row.subscriptionCode,
    memberId: row.memberId,
    memberName: row.member.fullName,
    memberEmail: row.member.email,
    memberPhone: row.member.phone,
    memberCode: row.member.memberCode,
    plan: row.plan,
    billing: row.billing,
    startDate: toDateOnlyIso(row.startDate),
    expiryDate: toDateOnlyIso(row.expiryDate),
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    payments: parseJsonArray<SubscriptionPaymentDto>(row.payments),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

async function nextSubscriptionCode(): Promise<string> {
  const latest = await prisma.subscription.findFirst({
    orderBy: { subscriptionCode: 'desc' },
    select: { subscriptionCode: true },
  })
  const match = latest?.subscriptionCode.match(/SUB-(\d{4})-(\d+)/)
  const year = new Date().getUTCFullYear()
  const next = (match ? Number(match[2]) : 4800) + 1
  return `SUB-${year}-${String(next).padStart(6, '0')}`
}

async function assertMember(memberId: string) {
  const member = await prisma.member.findFirst({
    where: { id: memberId, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      memberCode: true,
    },
  })
  if (!member) throw new AppError(400, 'Member not found')
  return member
}

function buildListWhere(query: SubscriptionListQuery): Prisma.SubscriptionWhereInput {
  const where: Prisma.SubscriptionWhereInput = {}

  if (query.status && query.status !== 'all') {
    where.status = query.status
  }

  if (query.plan && query.plan !== 'all') {
    where.plan = query.plan
  }

  if (query.billing && query.billing !== 'all') {
    where.billing = query.billing
  }

  if (query.memberId && query.memberId !== 'all') {
    where.memberId = query.memberId
  }

  if (query.expiry && query.expiry !== 'any') {
    const days = query.expiry === '7d' ? 7 : query.expiry === '30d' ? 30 : 90
    const now = new Date()
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000)
    where.expiryDate = { gte: start, lte: end }
  }

  if (query.search?.trim()) {
    const q = query.search.trim()
    where.OR = [
      { subscriptionCode: { contains: q, mode: 'insensitive' } },
      { member: { fullName: { contains: q, mode: 'insensitive' } } },
      { member: { email: { contains: q, mode: 'insensitive' } } },
      { member: { memberCode: { contains: q, mode: 'insensitive' } } },
    ]
  }

  return where
}

export async function listSubscriptions(
  query: SubscriptionListQuery,
): Promise<SubscriptionListResult> {
  const where = buildListWhere(query)
  const skip = (query.page - 1) * query.pageSize
  const sortBy = query.sortBy ?? 'createdAt'
  const sortOrder = query.sortOrder ?? 'desc'

  const now = new Date()
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  const in30Days = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [total, rows, summaryTotal, active, expired, expiringSoon] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      include: memberSelect,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: query.pageSize,
    }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({ where: { status: 'expired' } }),
    prisma.subscription.count({
      where: {
        status: 'active',
        expiryDate: { gte: startOfToday, lte: in30Days },
      },
    }),
  ])

  return {
    subscriptions: rows.map(toDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
    summary: {
      total: summaryTotal,
      active,
      expiringSoon,
      expired,
    },
  }
}

export async function getSubscriptionById(id: string): Promise<SubscriptionDto> {
  const row = await prisma.subscription.findUnique({
    where: { id },
    include: memberSelect,
  })
  if (!row) throw new AppError(404, 'Subscription not found')
  return toDto(row)
}

export async function createSubscription(
  input: SubscriptionWriteInput,
): Promise<SubscriptionDto> {
  if (!input.memberId || !input.plan || !input.startDate || !input.expiryDate) {
    throw new AppError(400, 'Missing required subscription fields')
  }

  await assertMember(input.memberId)
  const plan = input.plan as SubscriptionPlanType
  const billing = (input.billing ?? input.plan) as SubscriptionPlanType
  const amount = input.amount ?? defaultAmount(plan)
  const payments =
    input.payments ??
    [
      {
        id: `pay-${Date.now()}`,
        reference: `TXN-IL-${Math.floor(900000 + Math.random() * 9999)}`,
        paidAt: input.startDate,
        amountLabel: amountLabel(plan, amount),
        status: 'Paid' as const,
      },
    ]

  const row = await prisma.subscription.create({
    data: {
      subscriptionCode: await nextSubscriptionCode(),
      memberId: input.memberId,
      plan,
      billing,
      startDate: parseDateInput(input.startDate),
      expiryDate: parseDateInput(input.expiryDate),
      status: (input.status ?? 'active') as SubscriptionStatus,
      amount,
      currency: input.currency?.trim() || 'MYR',
      payments: payments as unknown as Prisma.InputJsonValue,
    },
    include: memberSelect,
  })

  return toDto(row)
}

export async function updateSubscription(
  id: string,
  input: SubscriptionWriteInput,
): Promise<SubscriptionDto> {
  const existing = await prisma.subscription.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Subscription not found')

  if (input.memberId) await assertMember(input.memberId)

  const startDate = input.startDate
    ? parseDateInput(input.startDate)
    : existing.startDate
  const expiryDate = input.expiryDate
    ? parseDateInput(input.expiryDate)
    : existing.expiryDate

  if (toDateOnlyIso(startDate) > toDateOnlyIso(expiryDate)) {
    throw new AppError(400, 'start date must not be after expiry date')
  }

  const row = await prisma.subscription.update({
    where: { id },
    data: {
      memberId: input.memberId,
      plan: input.plan as SubscriptionPlanType | undefined,
      billing: (input.billing ?? input.plan) as SubscriptionPlanType | undefined,
      startDate: input.startDate ? startDate : undefined,
      expiryDate: input.expiryDate ? expiryDate : undefined,
      status: input.status as SubscriptionStatus | undefined,
      amount: input.amount,
      currency: input.currency !== undefined ? input.currency.trim() || 'MYR' : undefined,
      payments: input.payments
        ? (input.payments as unknown as Prisma.InputJsonValue)
        : undefined,
    },
    include: memberSelect,
  })

  return toDto(row)
}

export async function updateSubscriptionStatus(
  id: string,
  status: 'active' | 'expired' | 'suspended' | 'cancelled',
): Promise<SubscriptionDto> {
  const existing = await prisma.subscription.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Subscription not found')

  const row = await prisma.subscription.update({
    where: { id },
    data: { status },
    include: memberSelect,
  })
  return toDto(row)
}

export async function renewSubscription(id: string): Promise<SubscriptionDto> {
  const existing = await prisma.subscription.findUnique({
    where: { id },
    include: memberSelect,
  })
  if (!existing) throw new AppError(404, 'Subscription not found')

  const base = new Date(existing.expiryDate)
  if (existing.plan === 'Annual') {
    base.setUTCFullYear(base.getUTCFullYear() + 1)
  } else {
    base.setUTCMonth(base.getUTCMonth() + 1)
  }

  const payment: SubscriptionPaymentDto = {
    id: `pay-${Date.now()}`,
    reference: `TXN-IL-${Math.floor(900000 + Math.random() * 9999)}`,
    paidAt: toDateOnlyIso(new Date()),
    amountLabel: amountLabel(existing.plan, existing.amount),
    status: 'Paid',
  }
  const payments = [...parseJsonArray<SubscriptionPaymentDto>(existing.payments), payment]

  const row = await prisma.subscription.update({
    where: { id },
    data: {
      status: 'active',
      expiryDate: base,
      payments: payments as unknown as Prisma.InputJsonValue,
    },
    include: memberSelect,
  })
  return toDto(row)
}

export async function bulkUpdateSubscriptionStatus(
  ids: string[],
  status: 'active' | 'expired' | 'suspended' | 'cancelled',
): Promise<number> {
  if (ids.length === 0) return 0
  const result = await prisma.subscription.updateMany({
    where: { id: { in: ids } },
    data: { status },
  })
  return result.count
}
