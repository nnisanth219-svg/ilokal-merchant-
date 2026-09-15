import type { NextFunction, Request, Response } from 'express'
import {
  bulkSoftDeleteReviews,
  bulkUpdateReviewStatus,
  createReview,
  getReviewById,
  listReviews,
  softDeleteReview,
  updateReview,
  updateReviewStatus,
} from '../services/review.service.js'
import { recordAuditFromRequest } from '../services/auditLog.service.js'
import type {
  DateFilterValue,
  ReviewListQuery,
  ReviewStatusValue,
} from '../types/review.js'
import { AppError } from '../utils/errors.js'
import {
  parseReviewStatusBody,
  parseReviewWriteBody,
} from '../validation/review.validation.js'

function paramId(req: Request): string {
  const id = req.params.id
  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(400, 'Review id is required')
  }
  return id
}

function parseListQuery(req: Request): ReviewListQuery {
  const pageRaw = typeof req.query.page === 'string' ? Number.parseInt(req.query.page, 10) : 1
  const pageSizeRaw =
    typeof req.query.pageSize === 'string' ? Number.parseInt(req.query.pageSize, 10) : 25
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), 100)
    : 25

  let rating: number | 'all' = 'all'
  if (typeof req.query.rating === 'string' && req.query.rating !== 'all') {
    const n = Number.parseInt(req.query.rating, 10)
    if (Number.isFinite(n) && n >= 1 && n <= 5) rating = n
  }

  return {
    page,
    pageSize,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    status:
      typeof req.query.status === 'string'
        ? (req.query.status as ReviewStatusValue | 'all')
        : 'all',
    rating,
    memberId: typeof req.query.memberId === 'string' ? req.query.memberId : undefined,
    merchantId: typeof req.query.merchantId === 'string' ? req.query.merchantId : undefined,
    date:
      typeof req.query.date === 'string' ? (req.query.date as DateFilterValue) : 'any',
    includeDeleted:
      req.query.includeDeleted === 'true' || req.query.includeDeleted === '1',
    sortBy:
      typeof req.query.sortBy === 'string'
        ? (req.query.sortBy as ReviewListQuery['sortBy'])
        : 'submittedAt',
    sortOrder:
      req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc'
        ? req.query.sortOrder
        : 'desc',
  }
}

function parseIds(body: unknown): string[] {
  if (!body || typeof body !== 'object') return []
  const ids = (body as Record<string, unknown>).ids
  if (!Array.isArray(ids)) return []
  return ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
}

function reviewLabel(data: { memberName?: string; merchantName?: string; id: string }): string {
  return data.memberName || data.merchantName || data.id
}

export async function listReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listReviews(parseListQuery(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const includeDeleted =
      req.query.includeDeleted === 'true' || req.query.includeDeleted === '1'
    const data = await getReviewById(paramId(req), includeDeleted)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function createReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseReviewWriteBody(req.body, false)
    const data = await createReview(input)
    await recordAuditFromRequest(req, {
      action: 'CREATE',
      module: 'Reviews',
      entityId: data.id,
      entityLabel: reviewLabel(data),
      description: `Created review by ${reviewLabel(data)}`,
      newValue: data.status,
    })
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseReviewWriteBody(req.body, true)
    const data = await updateReview(paramId(req), input)
    await recordAuditFromRequest(req, {
      action: 'UPDATE',
      module: 'Reviews',
      entityId: data.id,
      entityLabel: reviewLabel(data),
      description: `Updated review by ${reviewLabel(data)}`,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateReviewStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = parseReviewStatusBody(req.body)
    const data = await updateReviewStatus(paramId(req), status)
    await recordAuditFromRequest(req, {
      action: 'STATUS_CHANGE',
      module: 'Reviews',
      entityId: data.id,
      entityLabel: reviewLabel(data),
      description: `Changed review status to ${status}`,
      newValue: status,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function deleteReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await softDeleteReview(paramId(req))
    await recordAuditFromRequest(req, {
      action: 'DELETE',
      module: 'Reviews',
      entityId: data.id,
      entityLabel: reviewLabel(data),
      description: `Deleted review by ${reviewLabel(data)}`,
    })
    res.status(200).json({ success: true, data, message: 'Review deleted' })
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
    const status = parseReviewStatusBody(req.body)
    const count = await bulkUpdateReviewStatus(ids, status)
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
    const count = await bulkSoftDeleteReviews(parseIds(req.body))
    res.status(200).json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
}
