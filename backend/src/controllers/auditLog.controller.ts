import type { NextFunction, Request, Response } from 'express'
import { getAuditLogById, listAuditLogs } from '../services/auditLog.service.js'
import type { AuditLogListQuery, AuditStatusValue } from '../types/auditLog.js'
import { AppError } from '../utils/errors.js'

function paramId(req: Request): string {
  const id = req.params.id
  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(400, 'Audit log id is required')
  }
  return id
}

function parseListQuery(req: Request): AuditLogListQuery {
  const pageRaw = typeof req.query.page === 'string' ? Number.parseInt(req.query.page, 10) : 1
  const pageSizeRaw =
    typeof req.query.pageSize === 'string' ? Number.parseInt(req.query.pageSize, 10) : 25
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), 100)
    : 25

  const dateRangeRaw = typeof req.query.dateRange === 'string' ? req.query.dateRange : 'any'
  const dateRange =
    dateRangeRaw === '7d' || dateRangeRaw === '30d' || dateRangeRaw === '90d'
      ? dateRangeRaw
      : 'any'

  return {
    page,
    pageSize,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    module: typeof req.query.module === 'string' ? req.query.module : 'all',
    action: typeof req.query.action === 'string' ? req.query.action : 'all',
    status:
      typeof req.query.status === 'string'
        ? (req.query.status as AuditStatusValue | 'all')
        : 'all',
    adminId:
      typeof req.query.adminId === 'string'
        ? req.query.adminId
        : typeof req.query.admin === 'string'
          ? req.query.admin
          : 'all',
    dateRange,
    sortBy:
      typeof req.query.sortBy === 'string'
        ? (req.query.sortBy as AuditLogListQuery['sortBy'])
        : 'createdAt',
    sortOrder:
      req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc'
        ? req.query.sortOrder
        : 'desc',
  }
}

export async function listAuditLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listAuditLogs(parseListQuery(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getAuditLogHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getAuditLogById(paramId(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
