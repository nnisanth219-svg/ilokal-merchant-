export type AuditStatusValue = 'success' | 'failed' | 'warning'

export type AuditActionCode =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'RESTORE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'INVITE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'STATUS_CHANGE'
  | 'ROLE_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'SETTINGS_UPDATE'
  | 'RENEW'
  | 'BULK_UPDATE'
  | 'BULK_DELETE'

export type AuditModule =
  | 'Merchants'
  | 'Offers'
  | 'Members'
  | 'Admin Users'
  | 'Settings'
  | 'Subscriptions'
  | 'Categories'
  | 'Redemptions'
  | 'Reviews'
  | 'Auth'
  | 'Dashboard'

export interface AuditLogDto {
  id: string
  occurredAt: string
  adminId: string
  adminName: string
  action: string
  actionCode: string
  module: string
  description: string
  status: AuditStatusValue
  reason: string
  ipLabel: string
  target?: string
  previousValue?: string
  newValue?: string
  entityId?: string | null
  metadata?: unknown
  userAgent?: string | null
}

export interface AuditLogListQuery {
  page: number
  pageSize: number
  search?: string
  module?: string | 'all'
  action?: string | 'all'
  status?: AuditStatusValue | 'all'
  adminId?: string | 'all'
  dateRange?: 'any' | '7d' | '30d' | '90d'
  sortBy?: 'createdAt' | 'module' | 'action'
  sortOrder?: 'asc' | 'desc'
}

export interface AuditLogListResult {
  logs: AuditLogDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    today: number
    warnings: number
    failed: number
  }
}

export interface WriteAuditInput {
  actorId?: string | null
  actorName: string
  actorEmail?: string
  action: AuditActionCode
  module: AuditModule
  entityId?: string | null
  entityLabel?: string | null
  description: string
  status?: AuditStatusValue
  reason?: string
  previousValue?: string | null
  newValue?: string | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}
