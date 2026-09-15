import type { JoinedFilter, Member, MembershipPlan, MemberStatus } from '../types/member'
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

export interface MemberListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: MemberStatus | 'all' | 'deleted'
  plan?: MembershipPlan | 'all'
  joined?: JoinedFilter
  includeDeleted?: boolean
}

export interface MemberListResponse {
  members: Member[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    active: number
    expired: number
    suspended: number
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

export function listMembersApi(params: MemberListParams = {}): Promise<MemberListResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('pageSize', String(params.pageSize ?? 25))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.plan && params.plan !== 'all') query.set('plan', params.plan)
  if (params.joined && params.joined !== 'any') query.set('joined', params.joined)
  if (params.includeDeleted) query.set('includeDeleted', 'true')
  return request<MemberListResponse>(
    `/api/members?${query.toString()}`,
    { method: 'GET' },
    'Unable to load members',
  )
}

export function getMemberApi(id: string, includeDeleted = false): Promise<Member> {
  const q = includeDeleted ? '?includeDeleted=true' : ''
  return request<Member>(`/api/members/${id}${q}`, { method: 'GET' }, 'Unable to load member')
}

export function createMemberApi(body: {
  fullName: string
  email: string
  phone?: string
  city?: string
  status?: Exclude<MemberStatus, 'deleted'>
  plan?: MembershipPlan
  joinedAt?: string
  expiresAt?: string | null
}): Promise<Member> {
  return request<Member>(
    '/api/members',
    { method: 'POST', body: JSON.stringify(body) },
    'Unable to create member',
  )
}

export function updateMemberApi(
  id: string,
  body: Partial<{
    fullName: string
    email: string
    phone: string
    city: string
    status: Exclude<MemberStatus, 'deleted'>
    plan: MembershipPlan
    joinedAt: string
    expiresAt: string | null
  }>,
): Promise<Member> {
  return request<Member>(
    `/api/members/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) },
    'Unable to update member',
  )
}

export function updateMemberStatusApi(
  id: string,
  status: Exclude<MemberStatus, 'deleted'>,
): Promise<Member> {
  return request<Member>(
    `/api/members/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    'Unable to update member status',
  )
}

export function softDeleteMemberApi(id: string): Promise<Member> {
  return request<Member>(`/api/members/${id}`, { method: 'DELETE' }, 'Unable to delete member')
}

export function restoreMemberApi(id: string): Promise<Member> {
  return request<Member>(
    `/api/members/${id}/restore`,
    { method: 'PATCH' },
    'Unable to restore member',
  )
}

export function bulkUpdateMemberStatusApi(
  ids: string[],
  status: Exclude<MemberStatus, 'deleted'>,
): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/members/bulk/status',
    { method: 'POST', body: JSON.stringify({ ids, status }) },
    'Unable to update members',
  )
}

export function bulkSoftDeleteMembersApi(ids: string[]): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/members/bulk/delete',
    { method: 'POST', body: JSON.stringify({ ids }) },
    'Unable to delete members',
  )
}

export function bulkRestoreMembersApi(ids: string[]): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/members/bulk/restore',
    { method: 'POST', body: JSON.stringify({ ids }) },
    'Unable to restore members',
  )
}
