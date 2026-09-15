import type { Offer, OfferStatus, OfferType, Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type {
  OfferDto,
  OfferListQuery,
  OfferListResult,
  OfferWriteInput,
} from '../types/offer.js'
import { AppError } from '../utils/errors.js'

type OfferWithMerchant = Offer & {
  merchant: { businessName: string; category: string }
}

function formatValidity(from: Date, to: Date): string {
  const fmt = (date: Date) =>
    date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
  return `${fmt(from)} – ${fmt(to)}`
}

function benefitLabel(type: OfferType, value: string): string {
  if (type === 'percentage') return `${value} discount`
  if (type === 'free_item' || type === 'free_gift') return value || 'Free gift'
  if (type === 'bogo') return value || 'Buy one get one free'
  if (type === 'set_price' || type === 'member_pricing') return value || 'Member pricing'
  if (type === 'fixed') return `${value} off`
  if (type === 'voucher') return value || 'Voucher'
  return value
}

function toDateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function toDto(row: OfferWithMerchant): OfferDto {
  const isDeleted = row.deletedAt != null
  return {
    id: row.id,
    offerCode: row.offerCode,
    title: row.title,
    description: row.description,
    termsAndConditions: row.termsAndConditions,
    merchantId: row.merchantId,
    merchantName: row.merchant.businessName,
    category: row.merchant.category,
    offerType: row.offerType,
    benefitLabel: row.benefitLabel,
    benefitValue: row.benefitValue,
    eligibility: row.eligibility,
    validFrom: toDateOnlyIso(row.validFrom),
    validTo: toDateOnlyIso(row.validTo),
    validityLabel: row.validityLabel,
    redemptionInstructions: row.redemptionInstructions,
    redemptionLimit: row.redemptionLimit,
    maxRedemptions: row.maxRedemptions,
    maxRedemptionsPerMember: row.maxRedemptionsPerMember,
    imageUrl: row.imageUrl,
    redeemedCount: row.redeemedCount,
    status: isDeleted ? 'deleted' : row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  }
}

const merchantInclude = {
  merchant: { select: { businessName: true, category: true } },
} as const

async function nextOfferCode(): Promise<string> {
  const latest = await prisma.offer.findFirst({
    orderBy: { offerCode: 'desc' },
    select: { offerCode: true },
  })
  const match = latest?.offerCode.match(/OFR-(\d+)/)
  const next = (match ? Number(match[1]) : 100) + 1
  return `OFR-${String(next).padStart(4, '0')}`
}

function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function buildListWhere(query: OfferListQuery): Prisma.OfferWhereInput {
  const where: Prisma.OfferWhereInput = {}

  if (!query.includeDeleted) where.deletedAt = null

  if (query.status && query.status !== 'all') {
    if (query.status === 'deleted') {
      where.deletedAt = { not: null }
    } else {
      where.status = query.status
      if (!query.includeDeleted) where.deletedAt = null
    }
  }

  if (query.merchantId && query.merchantId !== 'all') {
    where.merchantId = query.merchantId
  }

  if (query.offerType && query.offerType !== 'all') {
    where.offerType = query.offerType
  }

  if (query.category && query.category !== 'all' && query.category !== 'All') {
    where.merchant = { category: query.category, deletedAt: null }
  }

  if (query.date && query.date !== 'any') {
    const now = Date.now()
    const days = query.date === '30d' ? 30 : query.date === '90d' ? 90 : 365
    where.createdAt = { gte: new Date(now - days * 24 * 60 * 60 * 1000) }
  }

  if (query.search?.trim()) {
    const q = query.search.trim()
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { offerCode: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { merchant: { businessName: { contains: q, mode: 'insensitive' } } },
    ]
  }

  return where
}

export async function listOffers(query: OfferListQuery): Promise<OfferListResult> {
  const where = buildListWhere(query)
  const skip = (query.page - 1) * query.pageSize
  const sortBy = query.sortBy ?? 'createdAt'
  const sortOrder = query.sortOrder ?? 'desc'

  const [total, rows, live, scheduled, expired, usageAgg, summaryTotal] = await Promise.all([
    prisma.offer.count({ where }),
    prisma.offer.findMany({
      where,
      include: merchantInclude,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: query.pageSize,
    }),
    prisma.offer.count({ where: { deletedAt: null, status: 'live' } }),
    prisma.offer.count({ where: { deletedAt: null, status: 'scheduled' } }),
    prisma.offer.count({ where: { deletedAt: null, status: 'expired' } }),
    prisma.offer.aggregate({
      where: { deletedAt: null },
      _sum: { redeemedCount: true },
    }),
    prisma.offer.count({ where: { deletedAt: null } }),
  ])

  return {
    offers: rows.map(toDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
    summary: {
      total: summaryTotal,
      live,
      scheduled,
      expired,
      usageTotal: usageAgg._sum.redeemedCount ?? 0,
    },
  }
}

export async function getOfferById(id: string, includeDeleted = false): Promise<OfferDto> {
  const row = await prisma.offer.findUnique({
    where: { id },
    include: merchantInclude,
  })
  if (!row || (!includeDeleted && row.deletedAt)) {
    throw new AppError(404, 'Offer not found')
  }
  return toDto(row)
}

async function assertMerchant(merchantId: string) {
  const merchant = await prisma.merchant.findFirst({
    where: { id: merchantId, deletedAt: null },
    select: { id: true, businessName: true, category: true },
  })
  if (!merchant) throw new AppError(400, 'Merchant not found')
  return merchant
}

async function syncMerchantOffersCount(merchantId: string): Promise<void> {
  const count = await prisma.offer.count({
    where: { merchantId, deletedAt: null, status: { in: ['live', 'scheduled'] } },
  })
  await prisma.merchant.update({
    where: { id: merchantId },
    data: { offersCount: count },
  })
}

export async function createOffer(input: OfferWriteInput): Promise<OfferDto> {
  if (!input.merchantId || !input.title || !input.offerType || !input.validFrom || !input.validTo) {
    throw new AppError(400, 'Missing required offer fields')
  }
  if (input.validFrom > input.validTo) {
    throw new AppError(400, 'start date must not be after end date')
  }

  await assertMerchant(input.merchantId)
  const offerType = input.offerType as OfferType
  const validFrom = parseDateInput(input.validFrom)
  const validTo = parseDateInput(input.validTo)
  const benefitValue = input.benefitValue?.trim() ?? ''

  const row = await prisma.offer.create({
    data: {
      offerCode: await nextOfferCode(),
      merchantId: input.merchantId,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      termsAndConditions: input.termsAndConditions?.trim() ?? '',
      offerType,
      benefitValue,
      benefitLabel: benefitLabel(offerType, benefitValue),
      eligibility: input.eligibility?.trim() ?? '',
      validFrom,
      validTo,
      validityLabel: formatValidity(validFrom, validTo),
      redemptionInstructions: input.redemptionInstructions?.trim() ?? '',
      redemptionLimit: input.redemptionLimit?.trim() ?? '',
      maxRedemptions: input.maxRedemptions ?? null,
      maxRedemptionsPerMember: input.maxRedemptionsPerMember ?? null,
      imageUrl: input.imageUrl ?? null,
      status: (input.status ?? 'draft') as OfferStatus,
    },
    include: merchantInclude,
  })

  await syncMerchantOffersCount(input.merchantId)
  return toDto(row)
}

export async function updateOffer(id: string, input: OfferWriteInput): Promise<OfferDto> {
  const existing = await prisma.offer.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Offer not found')

  const merchantId = input.merchantId ?? existing.merchantId
  if (input.merchantId) await assertMerchant(input.merchantId)

  const offerType = (input.offerType ?? existing.offerType) as OfferType
  const benefitValue =
    input.benefitValue !== undefined ? input.benefitValue.trim() : existing.benefitValue
  const validFrom = input.validFrom
    ? parseDateInput(input.validFrom)
    : existing.validFrom
  const validTo = input.validTo ? parseDateInput(input.validTo) : existing.validTo
  if (toDateOnlyIso(validFrom) > toDateOnlyIso(validTo)) {
    throw new AppError(400, 'start date must not be after end date')
  }

  const row = await prisma.offer.update({
    where: { id },
    data: {
      merchantId,
      title: input.title !== undefined ? input.title.trim() : undefined,
      description: input.description !== undefined ? input.description.trim() : undefined,
      termsAndConditions:
        input.termsAndConditions !== undefined
          ? input.termsAndConditions.trim()
          : undefined,
      offerType: input.offerType as OfferType | undefined,
      benefitValue: input.benefitValue !== undefined ? benefitValue : undefined,
      benefitLabel: benefitLabel(offerType, benefitValue),
      eligibility: input.eligibility !== undefined ? input.eligibility.trim() : undefined,
      validFrom,
      validTo,
      validityLabel: formatValidity(validFrom, validTo),
      redemptionInstructions:
        input.redemptionInstructions !== undefined
          ? input.redemptionInstructions.trim()
          : undefined,
      redemptionLimit:
        input.redemptionLimit !== undefined ? input.redemptionLimit.trim() : undefined,
      maxRedemptions: input.maxRedemptions === undefined ? undefined : input.maxRedemptions,
      maxRedemptionsPerMember:
        input.maxRedemptionsPerMember === undefined
          ? undefined
          : input.maxRedemptionsPerMember,
      imageUrl: input.imageUrl === undefined ? undefined : input.imageUrl,
      status: input.status as OfferStatus | undefined,
    },
    include: merchantInclude,
  })

  await syncMerchantOffersCount(existing.merchantId)
  if (merchantId !== existing.merchantId) await syncMerchantOffersCount(merchantId)
  return toDto(row)
}

export async function updateOfferStatus(
  id: string,
  status: 'live' | 'scheduled' | 'draft' | 'expired' | 'paused',
): Promise<OfferDto> {
  const existing = await prisma.offer.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Offer not found')

  const row = await prisma.offer.update({
    where: { id },
    data: { status },
    include: merchantInclude,
  })
  await syncMerchantOffersCount(existing.merchantId)
  return toDto(row)
}

export async function softDeleteOffer(id: string): Promise<OfferDto> {
  const existing = await prisma.offer.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Offer not found')
  if (existing.deletedAt) throw new AppError(400, 'Offer is already deleted')

  const row = await prisma.offer.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: merchantInclude,
  })
  await syncMerchantOffersCount(existing.merchantId)
  return toDto(row)
}

export async function restoreOffer(id: string): Promise<OfferDto> {
  const existing = await prisma.offer.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Offer not found')
  if (!existing.deletedAt) throw new AppError(400, 'Offer is not deleted')

  const row = await prisma.offer.update({
    where: { id },
    data: { deletedAt: null, status: 'draft' },
    include: merchantInclude,
  })
  await syncMerchantOffersCount(existing.merchantId)
  return toDto(row)
}

export async function duplicateOffer(id: string): Promise<OfferDto> {
  const existing = await prisma.offer.findUnique({
    where: { id },
    include: merchantInclude,
  })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Offer not found')

  const row = await prisma.offer.create({
    data: {
      offerCode: await nextOfferCode(),
      merchantId: existing.merchantId,
      title: `${existing.title} (Copy)`,
      description: existing.description,
      termsAndConditions: existing.termsAndConditions,
      offerType: existing.offerType,
      benefitLabel: existing.benefitLabel,
      benefitValue: existing.benefitValue,
      eligibility: existing.eligibility,
      validFrom: existing.validFrom,
      validTo: existing.validTo,
      validityLabel: existing.validityLabel,
      redemptionInstructions: existing.redemptionInstructions,
      redemptionLimit: existing.redemptionLimit,
      maxRedemptions: existing.maxRedemptions,
      maxRedemptionsPerMember: existing.maxRedemptionsPerMember,
      imageUrl: existing.imageUrl,
      redeemedCount: 0,
      status: 'draft',
    },
    include: merchantInclude,
  })
  await syncMerchantOffersCount(existing.merchantId)
  return toDto(row)
}

export async function bulkUpdateOfferStatus(
  ids: string[],
  status: 'live' | 'scheduled' | 'draft' | 'expired' | 'paused',
): Promise<number> {
  if (ids.length === 0) return 0
  const result = await prisma.offer.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { status },
  })
  const merchantIds = await prisma.offer.findMany({
    where: { id: { in: ids } },
    select: { merchantId: true },
    distinct: ['merchantId'],
  })
  await Promise.all(merchantIds.map((m) => syncMerchantOffersCount(m.merchantId)))
  return result.count
}

export async function bulkSoftDeleteOffers(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0
  const merchantIds = await prisma.offer.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { merchantId: true },
    distinct: ['merchantId'],
  })
  const result = await prisma.offer.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date() },
  })
  await Promise.all(merchantIds.map((m) => syncMerchantOffersCount(m.merchantId)))
  return result.count
}

export async function listMerchantsForOffers(): Promise<
  { id: string; name: string; category: string }[]
> {
  const rows = await prisma.merchant.findMany({
    where: { deletedAt: null },
    orderBy: { businessName: 'asc' },
    select: { id: true, businessName: true, category: true },
  })
  return rows.map((m) => ({
    id: m.id,
    name: m.businessName,
    category: m.category,
  }))
}
