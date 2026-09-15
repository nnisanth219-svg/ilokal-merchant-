import type {
  AdminRole,
  AdminUser,
  AdminUserStatus,
  RolePermissionMatrix,
} from '../types/adminUser'
import { apiFetch, requireApiBaseUrl } from './apiConfig'

interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

interface ApiFailure {
  success: false
  message: string
}

export interface AdminUserListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: AdminUserStatus | 'all'
  role?: AdminRole | 'all'
  includeDeleted?: boolean
}

export interface AdminUserListResponse {
  users: AdminUser[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    active: number
    pending: number
    inactive: number
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
  const response = await apiFetch(`${requireApiBaseUrl()}${path}`, {
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

export function listAdminUsersApi(
  params: AdminUserListParams = {},
): Promise<AdminUserListResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('pageSize', String(params.pageSize ?? 25))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.role && params.role !== 'all') query.set('role', params.role)
  if (params.includeDeleted) query.set('includeDeleted', 'true')
  return request<AdminUserListResponse>(
    `/api/admin-users?${query.toString()}`,
    { method: 'GET' },
    'Unable to load admin users',
  )
}

export function getAdminUserApi(id: string, includeDeleted = false): Promise<AdminUser> {
  const query = includeDeleted ? '?includeDeleted=true' : ''
  return request<AdminUser>(
    `/api/admin-users/${id}${query}`,
    { method: 'GET' },
    'Unable to load admin user',
  )
}

export function inviteAdminUserApi(input: {
  fullName: string
  email: string
  role: AdminRole
}): Promise<AdminUser> {
  return request<AdminUser>(
    '/api/admin-users/invite',
    { method: 'POST', body: JSON.stringify(input) },
    'Unable to invite admin user',
  )
}

export function updateAdminUserApi(
  id: string,
  patch: Partial<Pick<AdminUser, 'fullName' | 'email' | 'role' | 'status'>> & {
    permissions?: RolePermissionMatrix['permissions']
  },
): Promise<AdminUser> {
  return request<AdminUser>(
    `/api/admin-users/${id}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
    'Unable to update admin user',
  )
}

export function updateAdminUserStatusApi(
  id: string,
  status: Exclude<AdminUserStatus, 'deleted'>,
): Promise<AdminUser> {
  return request<AdminUser>(
    `/api/admin-users/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    'Unable to update admin user status',
  )
}

export function softDeleteAdminUserApi(id: string): Promise<AdminUser> {
  return request<AdminUser>(
    `/api/admin-users/${id}`,
    { method: 'DELETE' },
    'Unable to delete admin user',
  )
}

export function restoreAdminUserApi(id: string): Promise<AdminUser> {
  return request<AdminUser>(
    `/api/admin-users/${id}/restore`,
    { method: 'PATCH' },
    'Unable to restore admin user',
  )
}

export function bulkUpdateAdminUserStatusApi(
  ids: string[],
  status: Exclude<AdminUserStatus, 'deleted'>,
): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/admin-users/bulk/status',
    { method: 'POST', body: JSON.stringify({ ids, status }) },
    'Unable to update admin users',
  )
}

export function bulkSoftDeleteAdminUsersApi(ids: string[]): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/admin-users/bulk/delete',
    { method: 'POST', body: JSON.stringify({ ids }) },
    'Unable to delete admin users',
  )
}

export function listAdminRolesApi(): Promise<RolePermissionMatrix[]> {
  return request<RolePermissionMatrix[]>(
    '/api/admin-users/roles',
    { method: 'GET' },
    'Unable to load roles',
  )
}

export function getAdminUserPermissionsApi(id: string): Promise<RolePermissionMatrix> {
  return request<RolePermissionMatrix>(
    `/api/admin-users/${id}/permissions`,
    { method: 'GET' },
    'Unable to load permissions',
  )
}

export function updateRolePermissionsApi(
  roleCode: string,
  permissions: RolePermissionMatrix['permissions'],
): Promise<RolePermissionMatrix> {
  return request<RolePermissionMatrix>(
    `/api/admin-users/roles/${encodeURIComponent(roleCode)}/permissions`,
    { method: 'PATCH', body: JSON.stringify({ permissions }) },
    'Unable to update role permissions',
  )
}
