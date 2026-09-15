import type { NextFunction, Request, Response } from 'express'
import {
  bulkUpdateSubscriptionStatus,
  createSubscription,
  getSubscriptionById,
  listSubscriptions,
  renewSubscription,
  updateSubscription,
  updateSubscriptionStatus,
} from '../services/subscription.service.js'
import { recordAuditFromRequest } from '../services/auditLog.service.js'
import type {
  BillingCycleValue,
  ExpiryFilterValue,
  SubscriptionListQuery,
  SubscriptionPlanValue,
  SubscriptionStatusValue,
} from '../types/subscription.js'
import { AppError } from '../utils/errors.js'
import {
  parseSubscriptionStatusBody,
  parseSubscriptionWriteBody,
} from '../validation/subscription.validation.js'

function paramId(req: Request): string {
  const id = req.params.id
  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(400, 'Subscription id is required')
  }
  return id
}

function parseListQuery(req: Request): SubscriptionListQuery {
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
        ? (req.query.status as SubscriptionStatusValue | 'all')
        : 'all',
    plan:
      typeof req.query.plan === 'string'
        ? (req.query.plan as SubscriptionPlanValue | 'all')
        : 'all',
    billing:
      typeof req.query.billing === 'string'
        ? (req.query.billing as BillingCycleValue | 'all')
        : 'all',
    expiry:
      typeof req.query.expiry === 'string'
        ? (req.query.expiry as ExpiryFilterValue)
        : 'any',
    memberId: typeof req.query.memberId === 'string' ? req.query.memberId : undefined,
    sortBy:
      typeof req.query.sortBy === 'string'
        ? (req.query.sortBy as SubscriptionListQuery['sortBy'])
        : 'createdAt',
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

export async function listSubscriptionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listSubscriptions(parseListQuery(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getSubscriptionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getSubscriptionById(paramId(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function createSubscriptionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseSubscriptionWriteBody(req.body, false)
    const data = await createSubscription(input)
    await recordAuditFromRequest(req, {
      action: 'CREATE',
      module: 'Subscriptions',
      entityId: data.id,
      entityLabel: data.memberName || data.subscriptionCode,
      description: `Created subscription ${data.subscriptionCode}`,
      newValue: data.status,
    })
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateSubscriptionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseSubscriptionWriteBody(req.body, true)
    const data = await updateSubscription(paramId(req), input)
    await recordAuditFromRequest(req, {
      action: 'UPDATE',
      module: 'Subscriptions',
      entityId: data.id,
      entityLabel: data.memberName || data.subscriptionCode,
      description: `Updated subscription ${data.subscriptionCode}`,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateSubscriptionStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = parseSubscriptionStatusBody(req.body)
    const data = await updateSubscriptionStatus(paramId(req), status)
    await recordAuditFromRequest(req, {
      action: 'STATUS_CHANGE',
      module: 'Subscriptions',
      entityId: data.id,
      entityLabel: data.memberName || data.subscriptionCode,
      description: `Changed subscription status to ${status}`,
      newValue: status,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function renewSubscriptionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await renewSubscription(paramId(req))
    await recordAuditFromRequest(req, {
      action: 'RENEW',
      module: 'Subscriptions',
      entityId: data.id,
      entityLabel: data.memberName || data.subscriptionCode,
      description: `Renewed subscription ${data.subscriptionCode}`,
      newValue: data.expiryDate,
    })
    res.status(200).json({ success: true, data, message: 'Subscription renewed' })
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
    const status = parseSubscriptionStatusBody(req.body)
    const count = await bulkUpdateSubscriptionStatus(ids, status)
    res.status(200).json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
}
