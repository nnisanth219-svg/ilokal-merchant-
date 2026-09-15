import type { Prisma, Redemption, RedemptionStatus } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type {
  RedemptionActivityDto,
  RedemptionDto,
  RedemptionListQuery,
  RedemptionListResult,
  RedemptionWriteInput,
} from '../types/redemption.js'
import { AppError } from '../utils/errors.js'

type RedemptionWithRelations = Redemption & {
  member: { id: string; fullName: string }
  merchant: { id: string; businessName: string }
  offer: { id: string; title: string }
}

const includeRelations = {
  member: { select: { id: true, fullName: true } },
  merchant: { select: { id: true, businessName: true } },
  offer: { select: { id: true, title: true } },
} as const

function parseJsonArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value as T[]
}

function toDto(row: RedemptionWithRelations): RedemptionDto {
  return {
    id: row.id,
    redemptionCode: row.redemptionCode,
    memberId: row.memberId,
    memberName: row.member.fullName,
    merchantId: row.merchantId,
    merchantName: row.merchant.businessName,
    offerId: row.offerId,
    offerTitle: row.offer.title,
    redeemedAt: row.redeemedAt.toISOString(),
    status: row.status,
    method: row.method,
    verificationStatus: row.verificationStatus,
    activity: parseJsonArray<RedemptionActivityDto>(row.activity),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

async function nextRedemptionCode(): Promise<string> {
  const latest = await prisma.redemption.findFirst({
    orderBy: { redemptionCode: 'desc' },
    select: { redemptionCode: true },
  })
  const match = latest?.redemptionCode.match(/RED-(\d+)/)
  const next = (match ? Number(match[1]) : 1280) + 1
  return `RED-${String(next).padStart(6, '0')}`
}

async function assertParents(memberId: string, merchantId: string, offerId: string) {
  const [member, merchant, offer] = await Promise.all([
    prisma.member.findFirst({ where: { id: memberId, deletedAt: null }, select: { id: true } }),
    prisma.merchant.findFirst({
      where: { id: merchantId, deletedAt: null },
      select: { id: true },
    }),
    prisma.offer.findFirst({ where: { id: offerId, deletedAt: null }, select: { id: true } }),
  ])
  if (!member) throw new AppError(400, 'Member not found')
  if (!merchant) throw new AppError(400, 'Merchant not found')
  if (!offer) throw new AppError(400, 'Offer not found')
}

async function syncCounters(memberId: string, merchantId: string, offerId: string) {
  const [memberCount, merchantCount, offerCount, merchant30d] = await Promise.all([
    prisma.redemption.count({ where: { memberId, status: 'successful' } }),
    prisma.redemption.count({ where: { merchantId, status: 'successful' } }),
    prisma.redemption.count({ where: { offerId, status: 'successful' } }),
    prisma.redemption.count({
      where: {
        merchantId,
        status: 'successful',
        redeemedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  await Promise.all([
    prisma.member.update({
      where: { id: memberId },
      data: { totalRedemptions: memberCount },
    }),
    prisma.merchant.update({
      where: { id: merchantId },
      data: { redeemedCount: merchantCount, redeemed30d: merchant30d },
    }),
    prisma.offer.update({
      where: { id: offerId },
      data: { redeemedCount: offerCount },
    }),
  ])
}

function buildListWhere(query: RedemptionListQuery): Prisma.RedemptionWhereInput {
  const where: Prisma.RedemptionWhereInput = {}

  if (query.status && query.status !== 'all') where.status = query.status
  if (query.memberId && query.memberId !== 'all') where.memberId = query.memberId
  if (query.merchantId && query.merchantId !== 'all') where.merchantId = query.merchantId
  if (query.offerId && query.offerId !== 'all') where.offerId = query.offerId

  if (query.date && query.date !== 'any') {
    const days = query.date === '7d' ? 7 : query.date === '30d' ? 30 : 90
    where.redeemedAt = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  }

  if (query.search?.trim()) {
    const q = query.search.trim()
    where.OR = [
      { redemptionCode: { contains: q, mode: 'insensitive' } },
      { member: { fullName: { contains: q, mode: 'insensitive' } } },
      { merchant: { businessName: { contains: q, mode: 'insensitive' } } },
      { offer: { title: { contains: q, mode: 'insensitive' } } },
    ]
  }

  return where
}

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function startOfUtcMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

export async function listRedemptions(
  query: RedemptionListQuery,
): Promise<RedemptionListResult> {
  const where = buildListWhere(query)
  const skip = (query.page - 1) * query.pageSize
  const sortBy = query.sortBy ?? 'redeemedAt'
  const sortOrder = query.sortOrder ?? 'desc'
  const todayStart = startOfUtcDay()
  const monthStart = startOfUtcMonth()

  const [total, rows, summaryTotal, today, thisMonth, successful, memberOpts, merchantOpts, offerOpts] =
    await Promise.all([
      prisma.redemption.count({ where }),
      prisma.redemption.findMany({
        where,
        include: includeRelations,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: query.pageSize,
      }),
      prisma.redemption.count(),
      prisma.redemption.count({ where: { redeemedAt: { gte: todayStart } } }),
      prisma.redemption.count({ where: { redeemedAt: { gte: monthStart } } }),
      prisma.redemption.count({ where: { status: 'successful' } }),
      prisma.redemption.findMany({
        distinct: ['memberId'],
        select: { memberId: true, member: { select: { fullName: true } } },
      }),
      prisma.redemption.findMany({
        distinct: ['merchantId'],
        select: { merchantId: true, merchant: { select: { businessName: true } } },
      }),
      prisma.redemption.findMany({
        distinct: ['offerId'],
        select: { offerId: true, offer: { select: { title: true } } },
      }),
    ])

  return {
    redemptions: rows.map(toDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
    summary: {
      total: summaryTotal,
      today,
      thisMonth,
      successful,
    },
    filterOptions: {
      members: memberOpts
        .map((r) => ({ id: r.memberId, name: r.member.fullName }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      merchants: merchantOpts
        .map((r) => ({ id: r.merchantId, name: r.merchant.businessName }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      offers: offerOpts
        .map((r) => ({ id: r.offerId, title: r.offer.title }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    },
  }
}

export async function getRedemptionById(id: string): Promise<RedemptionDto> {
  const row = await prisma.redemption.findUnique({
    where: { id },
    include: includeRelations,
  })
  if (!row) throw new AppError(404, 'Redemption not found')
  return toDto(row)
}

export async function createRedemption(
  input: RedemptionWriteInput,
): Promise<RedemptionDto> {
  if (!input.memberId || !input.merchantId || !input.offerId) {
    throw new AppError(400, 'memberId, merchantId and offerId are required')
  }

  await assertParents(input.memberId, input.merchantId, input.offerId)
  const redeemedAt = input.redeemedAt ? new Date(input.redeemedAt) : new Date()
  const status = (input.status ?? 'successful') as RedemptionStatus
  const verificationStatus =
    input.verificationStatus?.trim() ||
    (status === 'successful' ? 'Verified' : status === 'failed' ? 'Rejected' : 'Voided')

  const activity =
    input.activity ??
    [
      {
        id: `act-${Date.now()}`,
        dateLabel: redeemedAt.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
        }).toUpperCase(),
        description: `Redemption recorded as ${status}`,
      },
    ]

  const row = await prisma.redemption.create({
    data: {
      redemptionCode: await nextRedemptionCode(),
      memberId: input.memberId,
      merchantId: input.merchantId,
      offerId: input.offerId,
      redeemedAt,
      status,
      method: input.method?.trim() || 'QR scan',
      verificationStatus,
      activity: activity as unknown as Prisma.InputJsonValue,
    },
    include: includeRelations,
  })

  await syncCounters(input.memberId, input.merchantId, input.offerId)
  return toDto(row)
}

export async function updateRedemption(
  id: string,
  input: RedemptionWriteInput,
): Promise<RedemptionDto> {
  const existing = await prisma.redemption.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Redemption not found')

  const memberId = input.memberId ?? existing.memberId
  const merchantId = input.merchantId ?? existing.merchantId
  const offerId = input.offerId ?? existing.offerId
  await assertParents(memberId, merchantId, offerId)

  const row = await prisma.redemption.update({
    where: { id },
    data: {
      memberId: input.memberId,
      merchantId: input.merchantId,
      offerId: input.offerId,
      redeemedAt: input.redeemedAt ? new Date(input.redeemedAt) : undefined,
      status: input.status as RedemptionStatus | undefined,
      method: input.method !== undefined ? input.method.trim() : undefined,
      verificationStatus:
        input.verificationStatus !== undefined
          ? input.verificationStatus.trim()
          : undefined,
      activity: input.activity
        ? (input.activity as unknown as Prisma.InputJsonValue)
        : undefined,
    },
    include: includeRelations,
  })

  await syncCounters(existing.memberId, existing.merchantId, existing.offerId)
  if (
    memberId !== existing.memberId ||
    merchantId !== existing.merchantId ||
    offerId !== existing.offerId
  ) {
    await syncCounters(memberId, merchantId, offerId)
  }

  return toDto(row)
}

export async function updateRedemptionStatus(
  id: string,
  status: 'successful' | 'failed' | 'cancelled',
): Promise<RedemptionDto> {
  const existing = await prisma.redemption.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Redemption not found')

  const verificationStatus =
    status === 'successful' ? 'Verified' : status === 'failed' ? 'Rejected' : 'Voided'

  const row = await prisma.redemption.update({
    where: { id },
    data: { status, verificationStatus },
    include: includeRelations,
  })
  await syncCounters(existing.memberId, existing.merchantId, existing.offerId)
  return toDto(row)
}
