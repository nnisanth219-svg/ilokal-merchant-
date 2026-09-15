import type { AuditLogEntry, AuditStatus } from '../types/auditLog'
import { requireApiBaseUrl } from './apiConfig'

interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

interface ApiFailure {
  success: false
  message: string
}

export interface AuditLogListParams {
  page?: number
  pageSize?: number
  search?: string
  module?: string
  action?: string
  status?: AuditStatus | 'all'
  adminId?: string
  dateRange?: 'any' | '7d' | '30d' | '90d'
}

export interface AuditLogListResponse {
  logs: AuditLogEntry[]
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

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message
  }
  return fallback
}

async function request<T>(
  path: string,
  init: RequestInit,
  fallbackError: string,
): Promise<T> {
  const response = await fetch(`${requireApiBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const payload = await parseJson(response)
  if (!response.ok) throw new Error(getErrorMessage(payload, fallbackError))
  const data = payload as ApiSuccess<T> | ApiFailure
  if (!data || typeof data !== 'object' || !('success' in data) || !data.success) {
    throw new Error(fallbackError)
  }
  return data.data
}

export function listAuditLogsApi(
  params: AuditLogListParams = {},
): Promise<AuditLogListResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('pageSize', String(params.pageSize ?? 25))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.module && params.module !== 'all') query.set('module', params.module)
  if (params.action && params.action !== 'all') query.set('action', params.action)
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.adminId && params.adminId !== 'all') query.set('adminId', params.adminId)
  if (params.dateRange && params.dateRange !== 'any') query.set('dateRange', params.dateRange)
  return request<AuditLogListResponse>(
    `/api/audit-logs?${query.toString()}`,
    { method: 'GET' },
    'Unable to load audit logs',
  )
}

export function getAuditLogApi(id: string): Promise<AuditLogEntry> {
  return request<AuditLogEntry>(
    `/api/audit-logs/${id}`,
    { method: 'GET' },
    'Unable to load audit log',
  )
}
