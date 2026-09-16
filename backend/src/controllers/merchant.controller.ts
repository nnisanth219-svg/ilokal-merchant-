import type { NextFunction, Request, Response } from 'express'
import {
  bulkChangeMerchantCategory,
  bulkSoftDeleteMerchants,
  bulkUpdateMerchantStatus,
  createMerchant,
  getMerchantById,
  importMerchants,
  listMerchants,
  restoreMerchant,
  softDeleteMerchant,
  updateMerchant,
  updateMerchantStatus,
} from '../services/merchant.service.js'
import { geocodeAddress } from '../services/geo.service.js'
import { recordAuditFromRequest } from '../services/auditLog.service.js'
import type { MerchantListQuery, MerchantStatusValue } from '../types/merchant.js'
import { AppError } from '../utils/errors.js'
import { parseMerchantWriteBody, parseStatusBody } from '../validation/merchant.validation.js'

function actorName(req: Request): string {
  return req.authUser?.name?.trim() || 'Admin'
}

function paramId(req: Request): string {
  const id = req.params.id
  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(400, 'Merchant id is required')
  }
  return id
}

function parseListQuery(req: Request): MerchantListQuery {
  const pageRaw = typeof req.query.page === 'string' ? Number.parseInt(req.query.page, 10) : 1
  const pageSizeRaw =
    typeof req.query.pageSize === 'string' ? Number.parseInt(req.query.pageSize, 10) : 25
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), 100)
    : 25

  const search = typeof req.query.search === 'string' ? req.query.search : undefined
  const status =
    typeof req.query.status === 'string'
      ? (req.query.status as MerchantStatusValue | 'all')
      : 'all'
  const category = typeof req.query.category === 'string' ? req.query.category : undefined
  const state = typeof req.query.state === 'string' ? req.query.state : undefined
  const added =
    typeof req.query.added === 'string'
      ? (req.query.added as MerchantListQuery['added'])
      : 'any'
  const includeDeleted =
    req.query.includeDeleted === 'true' || req.query.includeDeleted === '1'

  return {
    page,
    pageSize,
    search,
    status,
    category,
    state,
    added,
    includeDeleted,
  }
}

export async function listMerchantsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listMerchants(parseListQuery(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getMerchantHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = paramId(req)
    const includeDeleted =
      req.query.includeDeleted === 'true' || req.query.includeDeleted === '1'
    const data = await getMerchantById(id, includeDeleted)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function createMerchantHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseMerchantWriteBody(req.body, false)
    const data = await createMerchant(input, actorName(req))
    await recordAuditFromRequest(req, {
      action: 'CREATE',
      module: 'Merchants',
      entityId: data.id,
      entityLabel: data.businessName,
      description: `Created merchant ${data.businessName}`,
      newValue: data.status,
    })
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateMerchantHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = paramId(req)
    const input = parseMerchantWriteBody(req.body, true)
    const data = await updateMerchant(id, input, actorName(req))
    await recordAuditFromRequest(req, {
      action: 'UPDATE',
      module: 'Merchants',
      entityId: data.id,
      entityLabel: data.businessName,
      description: `Updated merchant ${data.businessName}`,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateMerchantStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = paramId(req)
    const status = parseStatusBody(req.body)
    const data = await updateMerchantStatus(id, status, actorName(req))
    await recordAuditFromRequest(req, {
      action: 'STATUS_CHANGE',
      module: 'Merchants',
      entityId: data.id,
      entityLabel: data.businessName,
      description: `Changed merchant status to ${status}`,
      newValue: status,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function deleteMerchantHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = paramId(req)
    const data = await softDeleteMerchant(id, actorName(req))
    await recordAuditFromRequest(req, {
      action: 'DELETE',
      module: 'Merchants',
      entityId: data.id,
      entityLabel: data.businessName,
      description: `Deleted merchant ${data.businessName}`,
    })
    res.status(200).json({ success: true, data, message: 'Merchant soft-deleted' })
  } catch (error) {
    next(error)
  }
}

export async function restoreMerchantHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = paramId(req)
    const data = await restoreMerchant(id, actorName(req))
    await recordAuditFromRequest(req, {
      action: 'RESTORE',
      module: 'Merchants',
      entityId: data.id,
      entityLabel: data.businessName,
      description: `Restored merchant ${data.businessName}`,
    })
    res.status(200).json({ success: true, data, message: 'Merchant restored' })
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
    const status = parseStatusBody(req.body)
    const count = await bulkUpdateMerchantStatus(ids, status, actorName(req))
    await recordAuditFromRequest(req, {
      action: 'BULK_UPDATE',
      module: 'Merchants',
      description: `Bulk updated status to ${status} for ${count} merchant(s)`,
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
    const count = await bulkSoftDeleteMerchants(ids)
    await recordAuditFromRequest(req, {
      action: 'BULK_DELETE',
      module: 'Merchants',
      description: `Bulk deleted ${count} merchant(s)`,
      metadata: { ids, count },
    })
    res.status(200).json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
}

export async function bulkCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.filter((id: unknown): id is string => typeof id === 'string')
      : []
    const category = typeof req.body?.category === 'string' ? req.body.category : ''
    const count = await bulkChangeMerchantCategory(ids, category)
    await recordAuditFromRequest(req, {
      action: 'BULK_UPDATE',
      module: 'Merchants',
      description: `Bulk changed category to ${category} for ${count} merchant(s)`,
      newValue: category,
      metadata: { ids, count },
    })
    res.status(200).json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
}

export async function importMerchantsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : req.body
    if (!Array.isArray(rows)) {
      throw new AppError(400, 'Import payload must be an array of merchant rows')
    }
    const data = await importMerchants(rows, actorName(req))
    await recordAuditFromRequest(req, {
      action: 'CREATE',
      module: 'Merchants',
      description: `Imported ${data.created} merchant(s) from CSV`,
      metadata: { created: data.created, failed: data.failed.length },
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function geocodeMerchantHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const raw = req.body as Record<string, unknown>
    const address = typeof raw.address === 'string' ? raw.address.trim() : ''
    const postcode = typeof raw.postcode === 'string' ? raw.postcode.trim() : ''
    const city = typeof raw.city === 'string' ? raw.city.trim() : ''
    const state = typeof raw.state === 'string' ? raw.state.trim() : ''
    const query = [address, postcode, city, state].filter(Boolean).join(', ')
    const data = await geocodeAddress(query)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
