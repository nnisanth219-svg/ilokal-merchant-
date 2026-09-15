import type { Category, CategoryStatus, Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type {
  CategoryDto,
  CategoryListQuery,
  CategoryListResult,
  CategoryWriteInput,
} from '../types/category.js'
import { AppError } from '../utils/errors.js'

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'category'
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name)
  let candidate = base
  let i = 2
  for (;;) {
    const existing = await prisma.category.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
    if (!existing) return candidate
    candidate = `${base}-${i}`
    i += 1
  }
}

async function countsFor(categoryId: string): Promise<{ merchantsCount: number; offersCount: number }> {
  const merchantsCount = await prisma.merchant.count({
    where: { categoryId, deletedAt: null },
  })
  const offersCount = await prisma.offer.count({
    where: {
      deletedAt: null,
      merchant: { categoryId, deletedAt: null },
    },
  })
  return { merchantsCount, offersCount }
}

async function toDto(row: Category): Promise<CategoryDto> {
  const isDeleted = row.deletedAt != null
  const { merchantsCount, offersCount } = await countsFor(row.id)
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    merchantsCount,
    offersCount,
    status: isDeleted ? 'deleted' : row.status,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  }
}

function buildListWhere(query: CategoryListQuery): Prisma.CategoryWhereInput {
  const where: Prisma.CategoryWhereInput = {}

  if (!query.includeDeleted) where.deletedAt = null

  if (query.status && query.status !== 'all') {
    if (query.status === 'deleted') {
      where.deletedAt = { not: null }
    } else {
      where.status = query.status
      if (!query.includeDeleted) where.deletedAt = null
    }
  }

  if (query.search?.trim()) {
    const q = query.search.trim()
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
    ]
  }

  return where
}

export async function listCategories(
  query: CategoryListQuery,
): Promise<CategoryListResult> {
  const where = buildListWhere(query)
  const skip = (query.page - 1) * query.pageSize
  const sortBy = query.sortBy ?? 'displayOrder'
  const sortOrder = query.sortOrder ?? 'asc'

  const [total, rows, summaryTotal, active, withMerchants] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: [{ [sortBy]: sortOrder }, { name: 'asc' }],
      skip,
      take: query.pageSize,
    }),
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.category.count({ where: { deletedAt: null, status: 'active' } }),
    prisma.category.count({
      where: {
        deletedAt: null,
        merchants: { some: { deletedAt: null } },
      },
    }),
  ])

  const categories = await Promise.all(rows.map((row) => toDto(row)))

  return {
    categories,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
    summary: {
      total: summaryTotal,
      active,
      withMerchants,
      empty: Math.max(0, summaryTotal - withMerchants),
    },
  }
}

export async function getCategoryById(
  id: string,
  includeDeleted = false,
): Promise<CategoryDto> {
  const row = await prisma.category.findUnique({ where: { id } })
  if (!row || (!includeDeleted && row.deletedAt)) {
    throw new AppError(404, 'Category not found')
  }
  return toDto(row)
}

export async function createCategory(input: CategoryWriteInput): Promise<CategoryDto> {
  if (!input.name?.trim()) throw new AppError(400, 'name is required')

  const name = input.name.trim()
  const duplicate = await prisma.category.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, deletedAt: null },
  })
  if (duplicate) throw new AppError(400, 'A category with this name already exists')

  const maxOrder = await prisma.category.aggregate({
    where: { deletedAt: null },
    _max: { displayOrder: true },
  })

  const row = await prisma.category.create({
    data: {
      name,
      slug: await uniqueSlug(name),
      description: input.description?.trim() ?? '',
      status: (input.status ?? 'active') as CategoryStatus,
      displayOrder: input.displayOrder ?? (maxOrder._max.displayOrder ?? 0) + 1,
    },
  })

  return toDto(row)
}

export async function updateCategory(
  id: string,
  input: CategoryWriteInput,
): Promise<CategoryDto> {
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Category not found')

  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) throw new AppError(400, 'name cannot be empty')
    const duplicate = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
        NOT: { id },
      },
    })
    if (duplicate) throw new AppError(400, 'A category with this name already exists')
  }

  const nextName = input.name?.trim() ?? existing.name
  const nameChanged = nextName !== existing.name

  const row = await prisma.category.update({
    where: { id },
    data: {
      name: input.name !== undefined ? nextName : undefined,
      slug: nameChanged ? await uniqueSlug(nextName, id) : undefined,
      description:
        input.description !== undefined ? input.description.trim() : undefined,
      status: input.status as CategoryStatus | undefined,
      displayOrder: input.displayOrder,
    },
  })

  if (nameChanged) {
    await prisma.merchant.updateMany({
      where: { categoryId: id },
      data: { category: nextName },
    })
  }

  return toDto(row)
}

export async function updateCategoryStatus(
  id: string,
  status: 'active' | 'inactive',
): Promise<CategoryDto> {
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Category not found')

  const row = await prisma.category.update({
    where: { id },
    data: { status },
  })
  return toDto(row)
}

export async function softDeleteCategory(id: string): Promise<CategoryDto> {
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Category not found')
  if (existing.deletedAt) throw new AppError(400, 'Category is already deleted')

  const merchantsCount = await prisma.merchant.count({
    where: { categoryId: id, deletedAt: null },
  })
  if (merchantsCount > 0) {
    throw new AppError(
      400,
      `Cannot delete category while ${merchantsCount} merchant(s) still use it. Reassign or deactivate merchants first.`,
    )
  }

  const row = await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'inactive' },
  })
  return toDto(row)
}

export async function restoreCategory(id: string): Promise<CategoryDto> {
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Category not found')
  if (!existing.deletedAt) throw new AppError(400, 'Category is not deleted')

  const row = await prisma.category.update({
    where: { id },
    data: { deletedAt: null, status: 'inactive' },
  })
  return toDto(row)
}

export async function bulkUpdateCategoryStatus(
  ids: string[],
  status: 'active' | 'inactive',
): Promise<number> {
  if (ids.length === 0) return 0
  const result = await prisma.category.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { status },
  })
  return result.count
}

export async function bulkSoftDeleteCategories(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0

  const blocked = await prisma.merchant.groupBy({
    by: ['categoryId'],
    where: { categoryId: { in: ids }, deletedAt: null },
    _count: { _all: true },
  })
  if (blocked.length > 0) {
    throw new AppError(
      400,
      'Cannot delete one or more categories that still have assigned merchants',
    )
  }

  const result = await prisma.category.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date(), status: 'inactive' },
  })
  return result.count
}

/** Resolve a category name to an existing (or created) Category for merchant writes. */
export async function resolveCategoryByName(name: string): Promise<{
  id: string
  name: string
}> {
  const trimmed = name.trim()
  if (!trimmed) throw new AppError(400, 'category is required')

  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' }, deletedAt: null },
  })
  if (existing) return { id: existing.id, name: existing.name }

  const created = await prisma.category.create({
    data: {
      name: trimmed,
      slug: await uniqueSlug(trimmed),
      status: 'active',
      displayOrder: 999,
      description: '',
    },
  })
  return { id: created.id, name: created.name }
}

export async function listActiveCategoryNames(): Promise<string[]> {
  const rows = await prisma.category.findMany({
    where: { deletedAt: null, status: 'active' },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: { name: true },
  })
  return rows.map((r) => r.name)
}
