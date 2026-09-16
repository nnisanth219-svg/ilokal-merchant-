import type { Member, MembershipPlan, MemberStatus, Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { isEmailConfigured, sendMail } from '../lib/mailer.js'
import type {
  MemberDto,
  MemberListQuery,
  MemberListResult,
  MemberPurchaseDto,
  MemberRedemptionDto,
  MemberReviewDto,
  MemberSupportNoteDto,
  MemberWriteInput,
  MembershipPlanValue,
} from '../types/member.js'
import { AppError } from '../utils/errors.js'

function formatDisplayDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function planLabel(plan: MembershipPlan): string {
  return plan === 'None' ? '—' : plan
}

function paymentStatusFor(status: MemberStatus): string {
  if (status === 'active') return 'Paid'
  if (status === 'expired') return 'Expired'
  return 'On hold'
}

function parseJsonArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value as T[]
}

function toDto(row: Member): MemberDto {
  const isDeleted = row.deletedAt != null
  const status = isDeleted ? 'deleted' : row.status
  const plan = row.plan as MembershipPlanValue
  return {
    id: row.id,
    memberCode: row.memberCode,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    city: row.city,
    status,
    plan,
    planLabel: planLabel(row.plan),
    joinedAt: row.joinedAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    totalPurchases: row.totalPurchases,
    totalRedemptions: row.totalRedemptions,
    reviewsCount: row.reviewsCount,
    purchases: parseJsonArray<MemberPurchaseDto>(row.purchases),
    redemptions: parseJsonArray<MemberRedemptionDto>(row.redemptions),
    reviews: parseJsonArray<MemberReviewDto>(row.reviews),
    device: {
      device: row.deviceName || '—',
      lastActive: row.lastActiveAt ? row.lastActiveAt.toISOString() : '',
      appVersion: row.appVersion || '—',
      platform: row.platform || '—',
    },
    subscription: {
      plan,
      status: isDeleted ? 'inactive' : row.status,
      startDate: formatDisplayDate(row.joinedAt),
      validUntil: formatDisplayDate(row.expiresAt),
      paymentStatus: row.paymentStatus || paymentStatusFor(row.status),
    },
    supportNotes: parseJsonArray<MemberSupportNoteDto>(row.supportNotes),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  }
}

async function nextMemberCode(): Promise<string> {
  const latest = await prisma.member.findFirst({
    orderBy: { memberCode: 'desc' },
    select: { memberCode: true },
  })
  const match = latest?.memberCode.match(/IL-(\d{4})-(\d+)/)
  const year = new Date().getUTCFullYear()
  const next = (match ? Number(match[2]) : 4800) + 1
  return `IL-${year}-${String(next).padStart(6, '0')}`
}

function buildListWhere(query: MemberListQuery): Prisma.MemberWhereInput {
  const where: Prisma.MemberWhereInput = {}

  if (!query.includeDeleted) where.deletedAt = null

  if (query.status && query.status !== 'all') {
    if (query.status === 'deleted') {
      where.deletedAt = { not: null }
    } else {
      where.status = query.status
      if (!query.includeDeleted) where.deletedAt = null
    }
  }

  if (query.plan && query.plan !== 'all') {
    where.plan = query.plan
  }

  if (query.joined && query.joined !== 'any') {
    const days = query.joined === '7d' ? 7 : query.joined === '30d' ? 30 : 90
    where.joinedAt = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  }

  if (query.merchantId && query.merchantId !== 'all') {
    where.redemptionRecords = { some: { merchantId: query.merchantId } }
  }

  if (query.search?.trim()) {
    const q = query.search.trim()
    where.OR = [
      { fullName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { memberCode: { contains: q, mode: 'insensitive' } },
    ]
  }

  return where
}

export async function listMembers(query: MemberListQuery): Promise<MemberListResult> {
  const where = buildListWhere(query)
  const skip = (query.page - 1) * query.pageSize
  const sortBy = query.sortBy ?? 'joinedAt'
  const sortOrder = query.sortOrder ?? 'desc'

  const [total, rows, active, expired, suspended, inactive, summaryTotal] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: query.pageSize,
    }),
    prisma.member.count({ where: { deletedAt: null, status: 'active' } }),
    prisma.member.count({ where: { deletedAt: null, status: 'expired' } }),
    prisma.member.count({ where: { deletedAt: null, status: 'suspended' } }),
    prisma.member.count({ where: { deletedAt: null, status: 'inactive' } }),
    prisma.member.count({ where: { deletedAt: null } }),
  ])

  return {
    members: rows.map(toDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
    summary: {
      total: summaryTotal,
      active,
      expired,
      suspended,
      inactive,
    },
  }
}

export async function getMemberById(id: string, includeDeleted = false): Promise<MemberDto> {
  const row = await prisma.member.findUnique({ where: { id } })
  if (!row || (!includeDeleted && row.deletedAt)) {
    throw new AppError(404, 'Member not found')
  }

  const dto = toDto(row)

  const [redemptionRows, reviewRows] = await Promise.all([
    prisma.redemption.findMany({
      where: { memberId: id },
      orderBy: { redeemedAt: 'desc' },
      take: 20,
      include: {
        merchant: { select: { businessName: true } },
        offer: { select: { title: true } },
      },
    }),
    prisma.review.findMany({
      where: { memberId: id, deletedAt: null },
      orderBy: { submittedAt: 'desc' },
      take: 20,
      include: { merchant: { select: { businessName: true } } },
    }),
  ])

  if (redemptionRows.length > 0) {
    dto.redemptions = redemptionRows.map((r) => ({
      id: r.id,
      date: r.redeemedAt.toISOString(),
      merchantName: r.merchant.businessName,
      offerTitle: r.offer.title,
      status: r.status === 'cancelled' ? 'Cancelled' : 'Redeemed',
    }))
    dto.totalRedemptions = await prisma.redemption.count({
      where: { memberId: id, status: 'successful' },
    })
  }

  if (reviewRows.length > 0) {
    dto.reviews = reviewRows.map((r) => ({
      id: r.id,
      merchantName: r.merchant.businessName,
      rating: r.rating,
      text: r.text,
      date: r.submittedAt.toISOString(),
    }))
    dto.reviewsCount = await prisma.review.count({
      where: { memberId: id, deletedAt: null, status: { not: 'hidden' } },
    })
  }

  return dto
}

export async function createMember(input: MemberWriteInput): Promise<MemberDto> {
  if (!input.fullName?.trim() || !input.email?.trim()) {
    throw new AppError(400, 'fullName and email are required')
  }

  const plan = (input.plan ?? 'None') as MembershipPlan
  const status = (input.status ?? 'active') as MemberStatus
  const joinedAt = input.joinedAt ? new Date(input.joinedAt) : new Date()
  const expiresAt =
    input.expiresAt === undefined
      ? plan === 'None'
        ? null
        : new Date(
            joinedAt.getTime() + (plan === 'Annual' ? 365 : 30) * 24 * 60 * 60 * 1000,
          )
      : input.expiresAt
        ? new Date(input.expiresAt)
        : null

  const purchases = input.purchases ?? []
  const redemptions = input.redemptions ?? []
  const reviews = input.reviews ?? []
  const supportNotes = input.supportNotes ?? []

  const row = await prisma.member.create({
    data: {
      memberCode: await nextMemberCode(),
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() ?? '',
      city: input.city?.trim() ?? '',
      status,
      plan,
      joinedAt,
      expiresAt,
      totalPurchases: purchases.length,
      totalRedemptions: redemptions.length,
      reviewsCount: reviews.length,
      deviceName: input.deviceName?.trim() ?? '',
      lastActiveAt: input.lastActiveAt ? new Date(input.lastActiveAt) : null,
      appVersion: input.appVersion?.trim() ?? '',
      platform: input.platform?.trim() ?? '',
      paymentStatus: input.paymentStatus?.trim() || paymentStatusFor(status),
      purchases: purchases as unknown as Prisma.InputJsonValue,
      redemptions: redemptions as unknown as Prisma.InputJsonValue,
      reviews: reviews as unknown as Prisma.InputJsonValue,
      supportNotes: supportNotes as unknown as Prisma.InputJsonValue,
    },
  })

  return toDto(row)
}

export async function updateMember(id: string, input: MemberWriteInput): Promise<MemberDto> {
  const existing = await prisma.member.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Member not found')

  const status = (input.status ?? existing.status) as MemberStatus

  const data: Prisma.MemberUpdateInput = {
    fullName: input.fullName !== undefined ? input.fullName.trim() : undefined,
    email: input.email !== undefined ? input.email.trim().toLowerCase() : undefined,
    phone: input.phone !== undefined ? input.phone.trim() : undefined,
    city: input.city !== undefined ? input.city.trim() : undefined,
    status: input.status as MemberStatus | undefined,
    plan: input.plan as MembershipPlan | undefined,
    joinedAt: input.joinedAt ? new Date(input.joinedAt) : undefined,
    expiresAt:
      input.expiresAt === undefined
        ? undefined
        : input.expiresAt
          ? new Date(input.expiresAt)
          : null,
    deviceName: input.deviceName !== undefined ? input.deviceName.trim() : undefined,
    lastActiveAt:
      input.lastActiveAt === undefined
        ? undefined
        : input.lastActiveAt
          ? new Date(input.lastActiveAt)
          : null,
    appVersion: input.appVersion !== undefined ? input.appVersion.trim() : undefined,
    platform: input.platform !== undefined ? input.platform.trim() : undefined,
    paymentStatus:
      input.paymentStatus !== undefined
        ? input.paymentStatus.trim() || paymentStatusFor(status)
        : input.status
          ? paymentStatusFor(status)
          : undefined,
  }

  if (input.purchases) {
    data.purchases = input.purchases as unknown as Prisma.InputJsonValue
    data.totalPurchases = input.purchases.length
  }
  if (input.redemptions) {
    data.redemptions = input.redemptions as unknown as Prisma.InputJsonValue
    data.totalRedemptions = input.redemptions.length
  }
  if (input.reviews) {
    data.reviews = input.reviews as unknown as Prisma.InputJsonValue
    data.reviewsCount = input.reviews.length
  }
  if (input.supportNotes) {
    data.supportNotes = input.supportNotes as unknown as Prisma.InputJsonValue
  }

  const row = await prisma.member.update({ where: { id }, data })
  return toDto(row)
}

export async function updateMemberStatus(
  id: string,
  status: 'active' | 'expired' | 'suspended' | 'inactive',
): Promise<MemberDto> {
  const existing = await prisma.member.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Member not found')

  const row = await prisma.member.update({
    where: { id },
    data: {
      status,
      paymentStatus: paymentStatusFor(status),
    },
  })
  return toDto(row)
}

export async function softDeleteMember(id: string): Promise<MemberDto> {
  const existing = await prisma.member.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Member not found')
  if (existing.deletedAt) throw new AppError(400, 'Member is already deleted')

  const row = await prisma.member.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: 'inactive',
      paymentStatus: paymentStatusFor('inactive'),
    },
  })
  return toDto(row)
}

export async function restoreMember(id: string): Promise<MemberDto> {
  const existing = await prisma.member.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Member not found')
  if (!existing.deletedAt) throw new AppError(400, 'Member is not deleted')

  const row = await prisma.member.update({
    where: { id },
    data: {
      deletedAt: null,
      status: 'inactive',
      paymentStatus: paymentStatusFor('inactive'),
    },
  })
  return toDto(row)
}

export async function bulkUpdateMemberStatus(
  ids: string[],
  status: 'active' | 'expired' | 'suspended' | 'inactive',
): Promise<number> {
  if (ids.length === 0) return 0
  const result = await prisma.member.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: {
      status,
      paymentStatus: paymentStatusFor(status),
    },
  })
  return result.count
}

export async function bulkSoftDeleteMembers(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0
  const result = await prisma.member.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: {
      deletedAt: new Date(),
      status: 'inactive',
      paymentStatus: paymentStatusFor('inactive'),
    },
  })
  return result.count
}

export async function bulkRestoreMembers(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0
  const result = await prisma.member.updateMany({
    where: { id: { in: ids }, deletedAt: { not: null } },
    data: {
      deletedAt: null,
      status: 'inactive',
      paymentStatus: paymentStatusFor('inactive'),
    },
  })
  return result.count
}

export interface MemberBroadcastResult {
  emailConfigured: boolean
  requested: number
  sent: number
  failed: number
}

export async function broadcastToMembers(
  ids: string[],
  subject: string,
  message: string,
): Promise<MemberBroadcastResult> {
  const cleanSubject = subject.trim()
  const cleanMessage = message.trim()
  if (!cleanSubject) throw new AppError(400, 'Broadcast subject is required')
  if (!cleanMessage) throw new AppError(400, 'Broadcast message is required')
  if (ids.length === 0) throw new AppError(400, 'Select at least one member')
  if (ids.length > 500) throw new AppError(400, 'Broadcast is limited to 500 members at a time')

  const emailConfigured = isEmailConfigured()
  if (!emailConfigured) {
    return { emailConfigured: false, requested: ids.length, sent: 0, failed: 0 }
  }

  const members = await prisma.member.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, email: true, fullName: true },
  })

  let sent = 0
  let failed = 0
  for (const member of members) {
    if (!member.email.trim()) {
      failed += 1
      continue
    }
    try {
      await sendMail({
        to: member.email,
        subject: cleanSubject,
        text: `Hi ${member.fullName},\n\n${cleanMessage}\n\n— iLokal`,
      })
      sent += 1
    } catch {
      failed += 1
    }
  }

  return { emailConfigured: true, requested: members.length, sent, failed }
}
