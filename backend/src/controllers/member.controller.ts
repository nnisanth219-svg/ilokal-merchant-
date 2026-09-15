import type { NextFunction, Request, Response } from 'express'
import {
  bulkRestoreMembers,
  bulkSoftDeleteMembers,
  bulkUpdateMemberStatus,
  createMember,
  getMemberById,
  listMembers,
  restoreMember,
  softDeleteMember,
  updateMember,
  updateMemberStatus,
} from '../services/member.service.js'
import { recordAuditFromRequest } from '../services/auditLog.service.js'
import type {
  JoinedFilterValue,
  MemberListQuery,
  MembershipPlanValue,
  MemberStatusValue,
} from '../types/member.js'
import { AppError } from '../utils/errors.js'
import { parseMemberStatusBody, parseMemberWriteBody } from '../validation/member.validation.js'

function paramId(req: Request): string {
  const id = req.params.id
  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(400, 'Member id is required')
  }
  return id
}

function parseListQuery(req: Request): MemberListQuery {
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
        ? (req.query.status as MemberStatusValue | 'all')
        : 'all',
    plan:
      typeof req.query.plan === 'string'
        ? (req.query.plan as MembershipPlanValue | 'all')
        : 'all',
    joined:
      typeof req.query.joined === 'string'
        ? (req.query.joined as JoinedFilterValue)
        : 'any',
    includeDeleted:
      req.query.includeDeleted === 'true' || req.query.includeDeleted === '1',
    sortBy:
      typeof req.query.sortBy === 'string'
        ? (req.query.sortBy as MemberListQuery['sortBy'])
        : 'joinedAt',
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

export async function listMembersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listMembers(parseListQuery(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getMemberHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const includeDeleted =
      req.query.includeDeleted === 'true' || req.query.includeDeleted === '1'
    const data = await getMemberById(paramId(req), includeDeleted)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function createMemberHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseMemberWriteBody(req.body, false)
    const data = await createMember(input)
    await recordAuditFromRequest(req, {
      action: 'CREATE',
      module: 'Members',
      entityId: data.id,
      entityLabel: data.fullName,
      description: `Created member ${data.fullName}`,
      newValue: data.status,
    })
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateMemberHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseMemberWriteBody(req.body, true)
    const data = await updateMember(paramId(req), input)
    await recordAuditFromRequest(req, {
      action: 'UPDATE',
      module: 'Members',
      entityId: data.id,
      entityLabel: data.fullName,
      description: `Updated member ${data.fullName}`,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateMemberStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = parseMemberStatusBody(req.body)
    const data = await updateMemberStatus(paramId(req), status)
    await recordAuditFromRequest(req, {
      action: 'STATUS_CHANGE',
      module: 'Members',
      entityId: data.id,
      entityLabel: data.fullName,
      description: `Changed member status to ${status}`,
      newValue: status,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function deleteMemberHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await softDeleteMember(paramId(req))
    await recordAuditFromRequest(req, {
      action: 'DELETE',
      module: 'Members',
      entityId: data.id,
      entityLabel: data.fullName,
      description: `Deleted member ${data.fullName}`,
    })
    res.status(200).json({ success: true, data, message: 'Member soft-deleted' })
  } catch (error) {
    next(error)
  }
}

export async function restoreMemberHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await restoreMember(paramId(req))
    await recordAuditFromRequest(req, {
      action: 'RESTORE',
      module: 'Members',
      entityId: data.id,
      entityLabel: data.fullName,
      description: `Restored member ${data.fullName}`,
    })
    res.status(200).json({ success: true, data, message: 'Member restored' })
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
    const status = parseMemberStatusBody(req.body)
    const count = await bulkUpdateMemberStatus(ids, status)
    await recordAuditFromRequest(req, {
      action: 'BULK_UPDATE',
      module: 'Members',
      description: `Bulk updated status to ${status} for ${count} member(s)`,
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
    const count = await bulkSoftDeleteMembers(ids)
    await recordAuditFromRequest(req, {
      action: 'BULK_DELETE',
      module: 'Members',
      description: `Bulk deleted ${count} member(s)`,
      metadata: { ids, count },
    })
    res.status(200).json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
}

export async function bulkRestoreHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ids = parseIds(req.body)
    const count = await bulkRestoreMembers(ids)
    await recordAuditFromRequest(req, {
      action: 'BULK_UPDATE',
      module: 'Members',
      description: `Bulk restored ${count} member(s)`,
      metadata: { ids, count },
    })
    res.status(200).json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
}
