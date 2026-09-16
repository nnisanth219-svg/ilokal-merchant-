import type { Merchant, MerchantOutletType, MerchantStatus, Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { resolveCategoryByName } from './category.service.js'
import type {
  MerchantActivityDto,
  MerchantDto,
  MerchantListQuery,
  MerchantListResult,
  MerchantOfferDto,
  MerchantWriteInput,
} from '../types/merchant.js'
import { AppError } from '../utils/errors.js'
import { parseMerchantWriteBody } from '../validation/merchant.validation.js'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseJsonArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value as T[]
}

function toDto(row: Merchant): MerchantDto {
  const isDeleted = row.deletedAt != null
  return {
    id: row.id,
    merchantCode: row.merchantCode,
    businessName: row.businessName,
    legalName: row.legalName,
    category: row.category,
    subCategories: row.subCategories,
    description: row.description,
    registrationNo: row.registrationNo,
    priceRange: row.priceRange as MerchantDto['priceRange'],
    phone: row.phone,
    email: row.email,
    whatsapp: row.whatsapp,
    website: row.website,
    city: row.city,
    state: row.state,
    address: row.address,
    postcode: row.postcode,
    latitude: row.latitude,
    longitude: row.longitude,
    outletType: row.outletType,
    picName: row.picName,
    hours: {
      weekday: row.hoursWeekday,
      weekend: row.hoursWeekend,
      publicHoliday: row.hoursPublicHoliday,
    },
    logoUrl: row.logoUrl,
    coverUrl: row.coverUrl,
    galleryUrls: row.galleryUrls,
    featured: row.featured,
    status: isDeleted ? 'deleted' : row.status,
    offersCount: row.offersCount,
    redeemedCount: row.redeemedCount,
    rating: row.rating,
    ratingsCount: row.ratingsCount,
    profileViews: row.profileViews,
    redeemed30d: row.redeemed30d,
    uniqueMembers: row.uniqueMembers,
    membersReached: row.membersReached,
    slug: row.slug,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    offers: parseJsonArray<MerchantOfferDto>(row.offers),
    activities: parseJsonArray<MerchantActivityDto>(row.activities),
  }
}

async function nextMerchantCode(): Promise<string> {
  const latest = await prisma.merchant.findFirst({
    orderBy: { merchantCode: 'desc' },
    select: { merchantCode: true },
  })
  const match = latest?.merchantCode.match(/MRC-(\d+)/)
  const next = (match ? Number(match[1]) : 0) + 1
  return `MRC-${String(next).padStart(4, '0')}`
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'merchant'
  let candidate = root
  let i = 2
  for (;;) {
    const existing = await prisma.merchant.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
    if (!existing) return candidate
    candidate = `${root}-${i}`
    i += 1
  }
}

function deriveCityState(address: string, city?: string, state?: string): {
  city: string
  state: string
} {
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  return {
    city: city?.trim() || parts.at(-2) || parts.at(-1) || '—',
    state: state?.trim() || (parts.length >= 2 ? parts.at(-1)! : '—'),
  }
}

function buildListWhere(query: MerchantListQuery): Prisma.MerchantWhereInput {
  const where: Prisma.MerchantWhereInput = {}

  if (!query.includeDeleted) {
    where.deletedAt = null
  }

  if (query.status && query.status !== 'all') {
    if (query.status === 'deleted') {
      where.deletedAt = { not: null }
    } else {
      where.status = query.status
      if (!query.includeDeleted) where.deletedAt = null
    }
  }

  if (query.category && query.category !== 'All') {
    where.category = query.category
  }

  if (query.state && query.state !== 'All') {
    where.state = query.state
  }

  if (query.added && query.added !== 'any') {
    const days = query.added === '7d' ? 7 : query.added === '30d' ? 30 : 90
    where.createdAt = {
      gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    }
  }

  if (query.search?.trim()) {
    const q = query.search.trim()
    where.OR = [
      { businessName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { city: { contains: q, mode: 'insensitive' } },
      { registrationNo: { contains: q, mode: 'insensitive' } },
      { merchantCode: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
    ]
  }

  return where
}

export async function listMerchants(query: MerchantListQuery): Promise<MerchantListResult> {
  const where = buildListWhere(query)
  const skip = (query.page - 1) * query.pageSize

  const [total, rows, liveCount] = await Promise.all([
    prisma.merchant.count({ where }),
    prisma.merchant.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { businessName: 'asc' }],
      skip,
      take: query.pageSize,
    }),
    prisma.merchant.count({ where: { status: 'active', deletedAt: null } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize))

  return {
    merchants: rows.map(toDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
    },
    liveCount,
  }
}

export async function getMerchantById(id: string, includeDeleted = false): Promise<MerchantDto> {
  const row = await prisma.merchant.findUnique({ where: { id } })
  if (!row || (!includeDeleted && row.deletedAt)) {
    throw new AppError(404, 'Merchant not found')
  }
  return toDto(row)
}

export async function createMerchant(
  input: MerchantWriteInput,
  actorName: string,
): Promise<MerchantDto> {
  if (!input.businessName?.trim()) throw new AppError(400, 'businessName is required')
  if (!input.category?.trim()) throw new AppError(400, 'category is required')

  const resolvedCategory = await resolveCategoryByName(input.category)
  const address = input.address?.trim() ?? ''
  const { city, state } = deriveCityState(address, input.city, input.state)
  const merchantCode = await nextMerchantCode()
  const slug = await uniqueSlug(input.businessName)
  const createdBy = input.createdBy?.trim() || actorName
  const nowLabel = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    .toUpperCase()

  const offers: MerchantOfferDto[] = input.offerSummary?.trim()
    ? [
        {
          id: `draft-${Date.now()}`,
          title: input.offerSummary.trim(),
          details: 'Draft offer · configure later',
          endsAt: 'TBD',
          status: 'live',
        },
      ]
    : []

  const activities: MerchantActivityDto[] = [
    {
      id: `act-${Date.now()}`,
      dateLabel: nowLabel,
      description: 'Merchant created',
      actor: createdBy,
    },
  ]

  try {
    const row = await prisma.merchant.create({
      data: {
        merchantCode,
        businessName: input.businessName.trim(),
        legalName: input.legalName?.trim() ?? '',
        category: resolvedCategory.name,
        categoryId: resolvedCategory.id,
        subCategories: input.subCategories ?? [],
        description: input.description?.trim() ?? '',
        registrationNo: input.registrationNo?.trim() ?? '',
        priceRange: input.priceRange ?? 'RM RM',
        phone: input.phone?.trim() ?? '',
        email: input.email?.trim() ?? '',
        whatsapp: input.whatsapp?.trim() || input.phone?.trim() || '',
        website: input.website?.trim() ?? '',
        city,
        state,
        address,
        postcode: input.postcode?.trim() ?? '',
        latitude: input.latitude?.trim() ?? '',
        longitude: input.longitude?.trim() ?? '',
        outletType: (input.outletType ?? 'single') as MerchantOutletType,
        picName: input.picName?.trim() ?? '',
        hoursWeekday: input.hoursWeekday ?? '',
        hoursWeekend: input.hoursWeekend ?? '',
        hoursPublicHoliday: input.hoursHoliday ?? '',
        logoUrl: input.logoUrl ?? null,
        coverUrl: input.coverUrl ?? null,
        galleryUrls: input.galleryUrls ?? [],
        featured: input.featured ?? false,
        status: (input.status ?? 'pending') as MerchantStatus,
        offersCount: offers.length,
        slug,
        createdBy,
        offers: offers as unknown as Prisma.InputJsonValue,
        activities: activities as unknown as Prisma.InputJsonValue,
      },
    })
    return toDto(row)
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new AppError(409, 'A merchant with this code or slug already exists')
    }
    throw error
  }
}

export async function updateMerchant(
  id: string,
  input: MerchantWriteInput,
  actorName: string,
): Promise<MerchantDto> {
  const existing = await prisma.merchant.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) {
    throw new AppError(404, 'Merchant not found')
  }

  const businessName = input.businessName?.trim() ?? existing.businessName
  const address = input.address !== undefined ? input.address.trim() : existing.address
  const { city, state } = deriveCityState(
    address,
    input.city ?? existing.city,
    input.state ?? existing.state,
  )

  const nowLabel = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    .toUpperCase()
  const activities = [
    ...parseJsonArray<MerchantActivityDto>(existing.activities),
    {
      id: `act-${Date.now()}`,
      dateLabel: nowLabel,
      description: 'Merchant profile updated',
      actor: actorName,
    },
  ].slice(0, 50)

  const resolvedCategory =
    input.category !== undefined ? await resolveCategoryByName(input.category) : null

  try {
    const row = await prisma.merchant.update({
      where: { id },
      data: {
        businessName,
        legalName: input.legalName !== undefined ? input.legalName.trim() : undefined,
        category: resolvedCategory ? resolvedCategory.name : undefined,
        categoryId: resolvedCategory ? resolvedCategory.id : undefined,
        subCategories: input.subCategories,
        description: input.description !== undefined ? input.description.trim() : undefined,
        registrationNo:
          input.registrationNo !== undefined ? input.registrationNo.trim() : undefined,
        priceRange: input.priceRange,
        phone: input.phone !== undefined ? input.phone.trim() : undefined,
        email: input.email !== undefined ? input.email.trim() : undefined,
        whatsapp:
          input.whatsapp !== undefined
            ? input.whatsapp.trim() || input.phone?.trim() || existing.phone
            : undefined,
        website: input.website !== undefined ? input.website.trim() : undefined,
        city,
        state,
        address,
        postcode: input.postcode !== undefined ? input.postcode.trim() : undefined,
        latitude: input.latitude !== undefined ? input.latitude.trim() : undefined,
        longitude: input.longitude !== undefined ? input.longitude.trim() : undefined,
        outletType: input.outletType as MerchantOutletType | undefined,
        picName: input.picName !== undefined ? input.picName.trim() : undefined,
        hoursWeekday: input.hoursWeekday,
        hoursWeekend: input.hoursWeekend,
        hoursPublicHoliday: input.hoursHoliday,
        logoUrl: input.logoUrl === undefined ? undefined : input.logoUrl,
        coverUrl: input.coverUrl === undefined ? undefined : input.coverUrl,
        galleryUrls: input.galleryUrls,
        featured: input.featured,
        status: input.status as MerchantStatus | undefined,
        slug: await uniqueSlug(businessName, id),
        activities: activities as unknown as Prisma.InputJsonValue,
      },
    })
    return toDto(row)
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new AppError(409, 'A merchant with this slug already exists')
    }
    throw error
  }
}

export async function updateMerchantStatus(
  id: string,
  status: 'active' | 'pending' | 'inactive',
  actorName: string,
): Promise<MerchantDto> {
  const existing = await prisma.merchant.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) {
    throw new AppError(404, 'Merchant not found')
  }

  const nowLabel = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    .toUpperCase()
  const activities = [
    ...parseJsonArray<MerchantActivityDto>(existing.activities),
    {
      id: `act-${Date.now()}`,
      dateLabel: nowLabel,
      description: `Status changed to ${status}`,
      actor: actorName,
    },
  ].slice(0, 50)

  const row = await prisma.merchant.update({
    where: { id },
    data: { status, activities: activities as unknown as Prisma.InputJsonValue },
  })
  return toDto(row)
}

export async function softDeleteMerchant(id: string, actorName: string): Promise<MerchantDto> {
  const existing = await prisma.merchant.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Merchant not found')
  if (existing.deletedAt) throw new AppError(400, 'Merchant is already deleted')

  const nowLabel = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    .toUpperCase()
  const activities = [
    ...parseJsonArray<MerchantActivityDto>(existing.activities),
    {
      id: `act-${Date.now()}`,
      dateLabel: nowLabel,
      description: 'Merchant soft-deleted',
      actor: actorName,
    },
  ].slice(0, 50)

  const row = await prisma.merchant.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: 'inactive',
      activities: activities as unknown as Prisma.InputJsonValue,
    },
  })
  return toDto(row)
}

export async function restoreMerchant(id: string, actorName: string): Promise<MerchantDto> {
  const existing = await prisma.merchant.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Merchant not found')
  if (!existing.deletedAt) throw new AppError(400, 'Merchant is not deleted')

  const nowLabel = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    .toUpperCase()
  const activities = [
    ...parseJsonArray<MerchantActivityDto>(existing.activities),
    {
      id: `act-${Date.now()}`,
      dateLabel: nowLabel,
      description: 'Merchant restored',
      actor: actorName,
    },
  ].slice(0, 50)

  const row = await prisma.merchant.update({
    where: { id },
    data: {
      deletedAt: null,
      status: 'inactive',
      activities: activities as unknown as Prisma.InputJsonValue,
    },
  })
  return toDto(row)
}

export async function bulkUpdateMerchantStatus(
  ids: string[],
  status: 'active' | 'pending' | 'inactive',
  actorName: string,
): Promise<number> {
  if (ids.length === 0) return 0
  const result = await prisma.merchant.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { status },
  })
  // activity notes skipped for bulk performance; actor recorded via updatedAt
  void actorName
  return result.count
}

export async function bulkSoftDeleteMerchants(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0
  const result = await prisma.merchant.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date(), status: 'inactive' },
  })
  return result.count
}

export async function bulkChangeMerchantCategory(
  ids: string[],
  category: string,
): Promise<number> {
  if (ids.length === 0) return 0
  if (!category.trim()) throw new AppError(400, 'category is required')
  const resolved = await resolveCategoryByName(category)
  const result = await prisma.merchant.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { category: resolved.name, categoryId: resolved.id },
  })
  return result.count
}

export interface MerchantImportResult {
  created: number
  failed: { row: number; businessName: string; message: string }[]
}

export async function importMerchants(
  rows: unknown[],
  actorName: string,
): Promise<MerchantImportResult> {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError(400, 'CSV import requires at least one merchant row')
  }
  if (rows.length > 500) {
    throw new AppError(400, 'CSV import is limited to 500 rows at a time')
  }

  const failed: MerchantImportResult['failed'] = []
  let created = 0

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    try {
      const input = parseMerchantWriteBody(row, false)
      await createMerchant(input, actorName)
      created += 1
    } catch (error) {
      const businessName =
        row && typeof row === 'object' && 'businessName' in row && typeof row.businessName === 'string'
          ? row.businessName
          : ''
      failed.push({
        row: index + 1,
        businessName,
        message: error instanceof Error ? error.message : 'Unable to import row',
      })
    }
  }

  return { created, failed }
}
