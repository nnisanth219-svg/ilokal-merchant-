import type { NextFunction, Request, Response } from 'express'
import {
  bulkSoftDeleteOffers,
  bulkUpdateOfferStatus,
  createOffer,
  duplicateOffer,
  getOfferById,
  listMerchantsForOffers,
  listOffers,
  restoreOffer,
  softDeleteOffer,
  updateOffer,
  updateOfferStatus,
} from '../services/offer.service.js'
import { recordAuditFromRequest } from '../services/auditLog.service.js'
import type { OfferListQuery, OfferStatusValue, OfferTypeValue } from '../types/offer.js'
import { AppError } from '../utils/errors.js'
import { parseOfferStatusBody, parseOfferWriteBody } from '../validation/offer.validation.js'

function paramId(req: Request): string {
  const id = req.params.id
  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(400, 'Offer id is required')
  }
  return id
}

function parseListQuery(req: Request): OfferListQuery {
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
        ? (req.query.status as OfferStatusValue | 'all')
        : 'all',
    merchantId: typeof req.query.merchantId === 'string' ? req.query.merchantId : undefined,
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    offerType:
      typeof req.query.offerType === 'string'
        ? (req.query.offerType as OfferTypeValue | 'all')
        : 'all',
    date:
      typeof req.query.date === 'string'
        ? (req.query.date as OfferListQuery['date'])
        : 'any',
    includeDeleted:
      req.query.includeDeleted === 'true' || req.query.includeDeleted === '1',
    sortBy:
      typeof req.query.sortBy === 'string'
        ? (req.query.sortBy as OfferListQuery['sortBy'])
        : 'createdAt',
    sortOrder:
      req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc'
        ? req.query.sortOrder
        : 'desc',
  }
}

export async function listOffersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listOffers(parseListQuery(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function listOfferMerchantsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listMerchantsForOffers()
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getOfferHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const includeDeleted =
      req.query.includeDeleted === 'true' || req.query.includeDeleted === '1'
    const data = await getOfferById(paramId(req), includeDeleted)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function createOfferHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseOfferWriteBody(req.body, false)
    const data = await createOffer(input)
    await recordAuditFromRequest(req, {
      action: 'CREATE',
      module: 'Offers',
      entityId: data.id,
      entityLabel: data.title,
      description: `Created offer ${data.title}`,
      newValue: data.status,
    })
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateOfferHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseOfferWriteBody(req.body, true)
    const data = await updateOffer(paramId(req), input)
    await recordAuditFromRequest(req, {
      action: 'UPDATE',
      module: 'Offers',
      entityId: data.id,
      entityLabel: data.title,
      description: `Updated offer ${data.title}`,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateOfferStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = parseOfferStatusBody(req.body)
    const data = await updateOfferStatus(paramId(req), status)
    await recordAuditFromRequest(req, {
      action: 'STATUS_CHANGE',
      module: 'Offers',
      entityId: data.id,
      entityLabel: data.title,
      description: `Changed offer status to ${status}`,
      newValue: status,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function deleteOfferHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await softDeleteOffer(paramId(req))
    await recordAuditFromRequest(req, {
      action: 'DELETE',
      module: 'Offers',
      entityId: data.id,
      entityLabel: data.title,
      description: `Deleted offer ${data.title}`,
    })
    res.status(200).json({ success: true, data, message: 'Offer soft-deleted' })
  } catch (error) {
    next(error)
  }
}

export async function restoreOfferHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await restoreOffer(paramId(req))
    await recordAuditFromRequest(req, {
      action: 'RESTORE',
      module: 'Offers',
      entityId: data.id,
      entityLabel: data.title,
      description: `Restored offer ${data.title}`,
    })
    res.status(200).json({ success: true, data, message: 'Offer restored' })
  } catch (error) {
    next(error)
  }
}

export async function duplicateOfferHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await duplicateOffer(paramId(req))
    res.status(201).json({ success: true, data })
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
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.filter((id: unknown): id is string => typeof id === 'string')
      : []
    const status = parseOfferStatusBody(req.body)
    const count = await bulkUpdateOfferStatus(ids, status)
    await recordAuditFromRequest(req, {
      action: 'BULK_UPDATE',
      module: 'Offers',
      description: `Bulk updated status to ${status} for ${count} offer(s)`,
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
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.filter((id: unknown): id is string => typeof id === 'string')
      : []
    const count = await bulkSoftDeleteOffers(ids)
    await recordAuditFromRequest(req, {
      action: 'BULK_DELETE',
      module: 'Offers',
      description: `Bulk deleted ${count} offer(s)`,
      metadata: { ids, count },
    })
    res.status(200).json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
}
