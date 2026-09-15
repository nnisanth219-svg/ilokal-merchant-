import type { Prisma, Review, ReviewStatus } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type {
  ReviewDto,
  ReviewListQuery,
  ReviewListResult,
  ReviewWriteInput,
} from '../types/review.js'
import { AppError } from '../utils/errors.js'

type ReviewWithRelations = Review & {
  member: { id: string; fullName: string }
  merchant: { id: string; businessName: string }
}

const includeRelations = {
  member: { select: { id: true, fullName: true } },
  merchant: { select: { id: true, businessName: true } },
} as const

function toDto(row: ReviewWithRelations): ReviewDto {
  return {
    id: row.id,
    memberId: row.memberId,
    memberName: row.member.fullName,
    merchantId: row.merchantId,
    merchantName: row.merchant.businessName,
    rating: row.rating,
    text: row.text,
    submittedAt: row.submittedAt.toISOString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  }
}

async function assertParents(memberId: string, merchantId: string) {
  const [member, merchant] = await Promise.all([
    prisma.member.findFirst({ where: { id: memberId, deletedAt: null }, select: { id: true } }),
    prisma.merchant.findFirst({
      where: { id: merchantId, deletedAt: null },
      select: { id: true },
    }),
  ])
  if (!member) throw new AppError(400, 'Member not found')
  if (!merchant) throw new AppError(400, 'Merchant not found')
}

async function syncReviewCounters(memberId: string, merchantId: string) {
  const [memberCount, publishedReviews] = await Promise.all([
    prisma.review.count({
      where: { memberId, deletedAt: null, status: { not: 'hidden' } },
    }),
    prisma.review.findMany({
      where: { merchantId, deletedAt: null, status: 'published' },
      select: { rating: true },
    }),
  ])

  const ratingsCount = publishedReviews.length
  const rating =
    ratingsCount > 0
      ? Math.round(
          (publishedReviews.reduce((sum, row) => sum + row.rating, 0) / ratingsCount) * 10,
        ) / 10
      : 0

  await Promise.all([
    prisma.member.update({
      where: { id: memberId },
      data: { reviewsCount: memberCount },
    }),
    prisma.merchant.update({
      where: { id: merchantId },
      data: { rating, ratingsCount },
    }),
  ])
}

function buildListWhere(query: ReviewListQuery): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = {}

  if (!query.includeDeleted) where.deletedAt = null

  if (query.status && query.status !== 'all') where.status = query.status
  if (query.memberId && query.memberId !== 'all') where.memberId = query.memberId
  if (query.merchantId && query.merchantId !== 'all') where.merchantId = query.merchantId
  if (query.rating && query.rating !== 'all') where.rating = query.rating

  if (query.date && query.date !== 'any') {
    const days = query.date === '7d' ? 7 : query.date === '30d' ? 30 : 90
    where.submittedAt = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  }

  if (query.search?.trim()) {
    const q = query.search.trim()
    where.OR = [
      { text: { contains: q, mode: 'insensitive' } },
      { member: { fullName: { contains: q, mode: 'insensitive' } } },
      { merchant: { businessName: { contains: q, mode: 'insensitive' } } },
    ]
  }

  return where
}

export async function listReviews(query: ReviewListQuery): Promise<ReviewListResult> {
  const where = buildListWhere(query)
  const skip = (query.page - 1) * query.pageSize
  const sortBy = query.sortBy ?? 'submittedAt'
  const sortOrder = query.sortOrder ?? 'desc'

  const [total, rows, allPublished, fiveStar, needsAttention, merchantRows] =
    await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: includeRelations,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: query.pageSize,
      }),
      prisma.review.findMany({
        where: { deletedAt: null },
        select: { rating: true },
      }),
      prisma.review.count({ where: { deletedAt: null, rating: 5 } }),
      prisma.review.count({
        where: { deletedAt: null, status: { in: ['pending', 'flagged'] } },
      }),
      prisma.review.findMany({
        where: { deletedAt: null },
        distinct: ['merchantId'],
        select: {
          merchantId: true,
          merchant: { select: { businessName: true } },
        },
      }),
    ])

  const avg =
    allPublished.length > 0
      ? Math.round(
          (allPublished.reduce((sum, row) => sum + row.rating, 0) / allPublished.length) * 10,
        ) / 10
      : 0

  return {
    reviews: rows.map(toDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
    summary: {
      total: allPublished.length,
      averageRating: avg,
      fiveStar,
      needsAttention,
    },
    filterOptions: {
      merchants: merchantRows
        .map((row) => ({ id: row.merchantId, name: row.merchant.businessName }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    },
  }
}

export async function getReviewById(id: string, includeDeleted = false): Promise<ReviewDto> {
  const row = await prisma.review.findUnique({
    where: { id },
    include: includeRelations,
  })
  if (!row || (!includeDeleted && row.deletedAt)) {
    throw new AppError(404, 'Review not found')
  }
  return toDto(row)
}

export async function createReview(input: ReviewWriteInput): Promise<ReviewDto> {
  if (!input.memberId || !input.merchantId || input.rating === undefined) {
    throw new AppError(400, 'memberId, merchantId and rating are required')
  }

  await assertParents(input.memberId, input.merchantId)

  const row = await prisma.review.create({
    data: {
      memberId: input.memberId,
      merchantId: input.merchantId,
      rating: input.rating,
      text: input.text?.trim() ?? '',
      submittedAt: input.submittedAt ? new Date(input.submittedAt) : new Date(),
      status: (input.status ?? 'pending') as ReviewStatus,
    },
    include: includeRelations,
  })

  await syncReviewCounters(input.memberId, input.merchantId)
  return toDto(row)
}

export async function updateReview(id: string, input: ReviewWriteInput): Promise<ReviewDto> {
  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Review not found')

  const memberId = input.memberId ?? existing.memberId
  const merchantId = input.merchantId ?? existing.merchantId
  await assertParents(memberId, merchantId)

  const row = await prisma.review.update({
    where: { id },
    data: {
      memberId: input.memberId,
      merchantId: input.merchantId,
      rating: input.rating,
      text: input.text !== undefined ? input.text.trim() : undefined,
      submittedAt: input.submittedAt ? new Date(input.submittedAt) : undefined,
      status: input.status as ReviewStatus | undefined,
    },
    include: includeRelations,
  })

  await syncReviewCounters(existing.memberId, existing.merchantId)
  if (memberId !== existing.memberId || merchantId !== existing.merchantId) {
    await syncReviewCounters(memberId, merchantId)
  }

  return toDto(row)
}

export async function updateReviewStatus(
  id: string,
  status: 'published' | 'pending' | 'flagged' | 'hidden',
): Promise<ReviewDto> {
  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Review not found')

  const row = await prisma.review.update({
    where: { id },
    data: { status },
    include: includeRelations,
  })
  await syncReviewCounters(existing.memberId, existing.merchantId)
  return toDto(row)
}

export async function softDeleteReview(id: string): Promise<ReviewDto> {
  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Review not found')
  if (existing.deletedAt) throw new AppError(400, 'Review is already deleted')

  const row = await prisma.review.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'hidden' },
    include: includeRelations,
  })
  await syncReviewCounters(existing.memberId, existing.merchantId)
  return toDto(row)
}

export async function bulkUpdateReviewStatus(
  ids: string[],
  status: 'published' | 'pending' | 'flagged' | 'hidden',
): Promise<number> {
  if (ids.length === 0) return 0
  const rows = await prisma.review.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, memberId: true, merchantId: true },
  })
  const result = await prisma.review.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { status },
  })
  const pairs = new Set(rows.map((row) => `${row.memberId}|${row.merchantId}`))
  await Promise.all(
    [...pairs].map((pair) => {
      const [memberId, merchantId] = pair.split('|')
      if (!memberId || !merchantId) return Promise.resolve()
      return syncReviewCounters(memberId, merchantId)
    }),
  )
  return result.count
}

export async function bulkSoftDeleteReviews(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0
  const rows = await prisma.review.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { memberId: true, merchantId: true },
  })
  const result = await prisma.review.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date(), status: 'hidden' },
  })
  const pairs = new Set(rows.map((row) => `${row.memberId}|${row.merchantId}`))
  await Promise.all(
    [...pairs].map((pair) => {
      const [memberId, merchantId] = pair.split('|')
      if (!memberId || !merchantId) return Promise.resolve()
      return syncReviewCounters(memberId, merchantId)
    }),
  )
  return result.count
}
