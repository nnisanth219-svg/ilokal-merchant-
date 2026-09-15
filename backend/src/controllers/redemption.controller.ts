import type { NextFunction, Request, Response } from 'express'
import {
  createRedemption,
  getRedemptionById,
  listRedemptions,
  updateRedemption,
  updateRedemptionStatus,
} from '../services/redemption.service.js'
import { recordAuditFromRequest } from '../services/auditLog.service.js'
import type {
  DateFilterValue,
  RedemptionListQuery,
  RedemptionStatusValue,
} from '../types/redemption.js'
import { AppError } from '../utils/errors.js'
import {
  parseRedemptionStatusBody,
  parseRedemptionWriteBody,
} from '../validation/redemption.validation.js'

function paramId(req: Request): string {
  const id = req.params.id
  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(400, 'Redemption id is required')
  }
  return id
}

function parseListQuery(req: Request): RedemptionListQuery {
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
        ? (req.query.status as RedemptionStatusValue | 'all')
        : 'all',
    memberId: typeof req.query.memberId === 'string' ? req.query.memberId : undefined,
    merchantId: typeof req.query.merchantId === 'string' ? req.query.merchantId : undefined,
    offerId: typeof req.query.offerId === 'string' ? req.query.offerId : undefined,
    date:
      typeof req.query.date === 'string' ? (req.query.date as DateFilterValue) : 'any',
    sortBy:
      typeof req.query.sortBy === 'string'
        ? (req.query.sortBy as RedemptionListQuery['sortBy'])
        : 'redeemedAt',
    sortOrder:
      req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc'
        ? req.query.sortOrder
        : 'desc',
  }
}

export async function listRedemptionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listRedemptions(parseListQuery(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getRedemptionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getRedemptionById(paramId(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function createRedemptionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseRedemptionWriteBody(req.body, false)
    const data = await createRedemption(input)
    await recordAuditFromRequest(req, {
      action: 'CREATE',
      module: 'Redemptions',
      entityId: data.id,
      entityLabel: data.offerTitle || data.redemptionCode,
      description: `Created redemption ${data.redemptionCode}`,
      newValue: data.status,
    })
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateRedemptionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseRedemptionWriteBody(req.body, true)
    const data = await updateRedemption(paramId(req), input)
    await recordAuditFromRequest(req, {
      action: 'UPDATE',
      module: 'Redemptions',
      entityId: data.id,
      entityLabel: data.offerTitle || data.redemptionCode,
      description: `Updated redemption ${data.redemptionCode}`,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateRedemptionStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = parseRedemptionStatusBody(req.body)
    const data = await updateRedemptionStatus(paramId(req), status)
    await recordAuditFromRequest(req, {
      action: 'STATUS_CHANGE',
      module: 'Redemptions',
      entityId: data.id,
      entityLabel: data.offerTitle || data.redemptionCode,
      description: `Changed redemption status to ${status}`,
      newValue: status,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
