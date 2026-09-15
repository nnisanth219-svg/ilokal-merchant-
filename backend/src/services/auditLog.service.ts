import type { Request } from 'express'
import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type {
  AuditActionCode,
  AuditLogDto,
  AuditLogListQuery,
  AuditLogListResult,
  AuditModule,
  WriteAuditInput,
} from '../types/auditLog.js'
import { AppError } from '../utils/errors.js'

function singularModule(module: string): string {
  if (module === 'Admin Users') return 'admin'
  if (module === 'Categories') return 'category'
  if (module === 'Settings') return 'settings'
  if (module.endsWith('s')) return module.slice(0, -1).toLowerCase()
  return module.toLowerCase()
}

export function buildActionLabel(
  action: AuditActionCode,
  module: AuditModule | string,
  newValue?: string | null,
): string {
  const item = singularModule(module)
  switch (action) {
    case 'CREATE':
      return module === 'Categories' ? 'Created category' : `Created ${item}`
    case 'UPDATE':
      return module === 'Merchants'
        ? 'Updated merchant'
        : module === 'Settings'
          ? 'Updated settings'
          : `Updated ${item}`
    case 'DELETE':
      return `Deleted ${item}`
    case 'RESTORE':
      return `Restored ${item}`
    case 'ACTIVATE':
      return `Activated ${item}`
    case 'DEACTIVATE':
      if (module === 'Offers') return 'Deactivated offer'
      if (module === 'Members') return 'Suspended member'
      return `Deactivated ${item}`
    case 'INVITE':
      return 'Invited admin'
    case 'LOGIN':
      return 'Logged in'
    case 'LOGOUT':
      return 'Logged out'
    case 'STATUS_CHANGE':
      if (newValue === 'inactive' || newValue === 'paused') {
        if (module === 'Offers') return 'Deactivated offer'
        if (module === 'Members') return 'Suspended member'
        return `Deactivated ${item}`
      }
      if (newValue === 'active') return `Activated ${item}`
      return `Changed ${item} status`
    case 'ROLE_CHANGE':
      return 'Changed role'
    case 'PERMISSION_CHANGE':
      return 'Updated role permissions'
    case 'SETTINGS_UPDATE':
      return 'Updated settings'
    case 'RENEW':
      return 'Renewed subscription'
    case 'BULK_UPDATE':
      return `Bulk updated ${item}s`
    case 'BULK_DELETE':
      return `Bulk deleted ${item}s`
    default:
      return `${action} ${module}`
  }
}

function formatIpLabel(ip?: string | null, userAgent?: string | null): string {
  const ipPart = ip?.trim() || 'Unknown IP'
  if (!userAgent?.trim()) return ipPart
  const ua = userAgent.toLowerCase()
  let device = 'Web'
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile'
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet'
  else if (ua.includes('mac')) device = 'Mac'
  else if (ua.includes('windows')) device = 'Windows'
  else if (ua.includes('linux')) device = 'Linux'
  return `${ipPart} · ${device}`
}

function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() || null
  }
  return req.socket.remoteAddress ?? null
}

function toDto(row: {
  id: string
  actorId: string | null
  actorName: string
  action: string
  actionLabel: string
  module: string
  entityId: string | null
  entityLabel: string | null
  description: string
  status: 'success' | 'failed' | 'warning'
  reason: string
  previousValue: string | null
  newValue: string | null
  metadata: Prisma.JsonValue | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}): AuditLogDto {
  return {
    id: row.id,
    occurredAt: row.createdAt.toISOString(),
    adminId: row.actorId ?? '',
    adminName: row.actorName,
    action: row.actionLabel,
    actionCode: row.action,
    module: row.module,
    description: row.description,
    status: row.status,
    reason: row.reason,
    ipLabel: formatIpLabel(row.ipAddress, row.userAgent),
    target: row.entityLabel ?? undefined,
    previousValue: row.previousValue ?? undefined,
    newValue: row.newValue ?? undefined,
    entityId: row.entityId,
    metadata: row.metadata ?? undefined,
    userAgent: row.userAgent,
  }
}

export async function writeAuditLog(input: WriteAuditInput): Promise<void> {
  try {
    const actionLabel = buildActionLabel(input.action, input.module, input.newValue)
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorName: input.actorName.trim() || 'System',
        actorEmail: input.actorEmail?.trim() || '',
        action: input.action,
        actionLabel,
        module: input.module,
        entityId: input.entityId ?? null,
        entityLabel: input.entityLabel ?? null,
        description: input.description,
        status: input.status ?? 'success',
        reason: input.reason ?? '',
        previousValue: input.previousValue ?? null,
        newValue: input.newValue ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    })
  } catch (error) {
    console.error('[audit] failed to write audit log', error)
  }
}

export async function recordAuditFromRequest(
  req: Request,
  input: Omit<WriteAuditInput, 'actorId' | 'actorName' | 'actorEmail' | 'ipAddress' | 'userAgent'> &
    Partial<Pick<WriteAuditInput, 'actorId' | 'actorName' | 'actorEmail'>>,
): Promise<void> {
  const actor = req.authUser
  await writeAuditLog({
    ...input,
    actorId: input.actorId ?? actor?.id ?? null,
    actorName: input.actorName ?? actor?.name ?? 'Admin',
    actorEmail: input.actorEmail ?? actor?.email ?? '',
    ipAddress: clientIp(req),
    userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
  })
}

function buildListWhere(query: AuditLogListQuery): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {}

  if (query.module && query.module !== 'all') where.module = query.module
  if (query.status && query.status !== 'all') where.status = query.status
  if (query.adminId && query.adminId !== 'all') where.actorId = query.adminId

  if (query.action && query.action !== 'all') {
    where.OR = [
      { actionLabel: query.action },
      { action: query.action },
    ]
  }

  if (query.dateRange && query.dateRange !== 'any') {
    const days = query.dateRange === '7d' ? 7 : query.dateRange === '30d' ? 30 : 90
    const from = new Date()
    from.setUTCDate(from.getUTCDate() - days)
    where.createdAt = { gte: from }
  }

  if (query.search?.trim()) {
    const q = query.search.trim()
    const searchClause: Prisma.AuditLogWhereInput[] = [
      { actorName: { contains: q, mode: 'insensitive' } },
      { actionLabel: { contains: q, mode: 'insensitive' } },
      { action: { contains: q, mode: 'insensitive' } },
      { module: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { reason: { contains: q, mode: 'insensitive' } },
      { entityLabel: { contains: q, mode: 'insensitive' } },
    ]
    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), { OR: searchClause }]
  }

  return where
}

export async function listAuditLogs(query: AuditLogListQuery): Promise<AuditLogListResult> {
  const where = buildListWhere(query)
  const skip = (query.page - 1) * query.pageSize
  const sortBy = query.sortBy ?? 'createdAt'
  const sortOrder = query.sortOrder ?? 'desc'
  const orderBy: Prisma.AuditLogOrderByWithRelationInput =
    sortBy === 'module'
      ? { module: sortOrder }
      : sortBy === 'action'
        ? { actionLabel: sortOrder }
        : { createdAt: sortOrder }

  const startOfToday = new Date()
  startOfToday.setUTCHours(0, 0, 0, 0)

  const [total, rows, summaryTotal, today, warnings, failed] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
    }),
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.auditLog.count({ where: { status: 'warning' } }),
    prisma.auditLog.count({ where: { status: 'failed' } }),
  ])

  return {
    logs: rows.map(toDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
    summary: {
      total: summaryTotal,
      today,
      warnings,
      failed,
    },
  }
}

export async function getAuditLogById(id: string): Promise<AuditLogDto> {
  const row = await prisma.auditLog.findUnique({ where: { id } })
  if (!row) throw new AppError(404, 'Audit log not found')
  return toDto(row)
}
