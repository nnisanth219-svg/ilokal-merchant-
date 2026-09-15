import type { NextFunction, Request, Response } from 'express'
import {
  bulkSoftDeleteCategories,
  bulkUpdateCategoryStatus,
  createCategory,
  getCategoryById,
  listCategories,
  restoreCategory,
  softDeleteCategory,
  updateCategory,
  updateCategoryStatus,
} from '../services/category.service.js'
import { recordAuditFromRequest } from '../services/auditLog.service.js'
import type { CategoryListQuery, CategoryStatusValue } from '../types/category.js'
import { AppError } from '../utils/errors.js'
import {
  parseCategoryStatusBody,
  parseCategoryWriteBody,
} from '../validation/category.validation.js'

function paramId(req: Request): string {
  const id = req.params.id
  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(400, 'Category id is required')
  }
  return id
}

function parseListQuery(req: Request): CategoryListQuery {
  const pageRaw = typeof req.query.page === 'string' ? Number.parseInt(req.query.page, 10) : 1
  const pageSizeRaw =
    typeof req.query.pageSize === 'string' ? Number.parseInt(req.query.pageSize, 10) : 25
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), 100)
    : 25

  return {
    page,
    pageSize,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    status:
      typeof req.query.status === 'string'
        ? (req.query.status as CategoryStatusValue | 'all')
        : 'all',
    includeDeleted:
      req.query.includeDeleted === 'true' || req.query.includeDeleted === '1',
    sortBy:
      typeof req.query.sortBy === 'string'
        ? (req.query.sortBy as CategoryListQuery['sortBy'])
        : 'displayOrder',
    sortOrder:
      req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc'
        ? req.query.sortOrder
        : 'asc',
  }
}

function parseIds(body: unknown): string[] {
  if (!body || typeof body !== 'object') return []
  const ids = (body as Record<string, unknown>).ids
  if (!Array.isArray(ids)) return []
  return ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
}

export async function listCategoriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listCategories(parseListQuery(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const includeDeleted =
      req.query.includeDeleted === 'true' || req.query.includeDeleted === '1'
    const data = await getCategoryById(paramId(req), includeDeleted)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function createCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseCategoryWriteBody(req.body, false)
    const data = await createCategory(input)
    await recordAuditFromRequest(req, {
      action: 'CREATE',
      module: 'Categories',
      entityId: data.id,
      entityLabel: data.name,
      description: `Created category ${data.name}`,
      newValue: data.status,
    })
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseCategoryWriteBody(req.body, true)
    const data = await updateCategory(paramId(req), input)
    await recordAuditFromRequest(req, {
      action: 'UPDATE',
      module: 'Categories',
      entityId: data.id,
      entityLabel: data.name,
      description: `Updated category ${data.name}`,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateCategoryStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = parseCategoryStatusBody(req.body)
    const data = await updateCategoryStatus(paramId(req), status)
    await recordAuditFromRequest(req, {
      action: 'STATUS_CHANGE',
      module: 'Categories',
      entityId: data.id,
      entityLabel: data.name,
      description: `Changed category status to ${status}`,
      newValue: status,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function deleteCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await softDeleteCategory(paramId(req))
    await recordAuditFromRequest(req, {
      action: 'DELETE',
      module: 'Categories',
      entityId: data.id,
      entityLabel: data.name,
      description: `Deleted category ${data.name}`,
    })
    res.status(200).json({ success: true, data, message: 'Category soft-deleted' })
  } catch (error) {
    next(error)
  }
}

export async function restoreCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await restoreCategory(paramId(req))
    await recordAuditFromRequest(req, {
      action: 'RESTORE',
      module: 'Categories',
      entityId: data.id,
      entityLabel: data.name,
      description: `Restored category ${data.name}`,
    })
    res.status(200).json({ success: true, data, message: 'Category restored' })
  } catch (error) {
    next(error)
  }
}

export async function bulkStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ids = parseIds(req.body)
    const status = parseCategoryStatusBody(req.body)
    const count = await bulkUpdateCategoryStatus(ids, status)
    await recordAuditFromRequest(req, {
      action: 'BULK_UPDATE',
      module: 'Categories',
      description: `Bulk updated status to ${status} for ${count} categories`,
      newValue: status,
      metadata: { ids, count },
    })
    res.status(200).json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
}

export async function bulkDeleteHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ids = parseIds(req.body)
    const count = await bulkSoftDeleteCategories(ids)
    await recordAuditFromRequest(req, {
      action: 'BULK_DELETE',
      module: 'Categories',
      description: `Bulk deleted ${count} categories`,
      metadata: { ids, count },
    })
    res.status(200).json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
}
