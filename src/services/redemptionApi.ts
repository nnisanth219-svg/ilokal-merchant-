import type { Redemption, RedemptionStatus } from '../types/redemption'
import { apiFetch, requireApiBaseUrl } from './apiConfig'

interface ApiSuccess<T> {
  success: true
  data: T
}

interface ApiFailure {
  success: false
  message: string
}

export interface RedemptionListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: RedemptionStatus | 'all'
  memberId?: string
  merchantId?: string
  offerId?: string
  date?: 'any' | '7d' | '30d' | '90d'
}

export interface RedemptionListResponse {
  redemptions: Redemption[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    today: number
    thisMonth: number
    successful: number
  }
  filterOptions: {
    members: { id: string; name: string }[]
    merchants: { id: string; name: string }[]
    offers: { id: string; title: string }[]
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

export function listRedemptionsApi(
  params: RedemptionListParams = {},
): Promise<RedemptionListResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('pageSize', String(params.pageSize ?? 25))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.memberId && params.memberId !== 'all') query.set('memberId', params.memberId)
  if (params.merchantId && params.merchantId !== 'all') {
    query.set('merchantId', params.merchantId)
  }
  if (params.offerId && params.offerId !== 'all') query.set('offerId', params.offerId)
  if (params.date && params.date !== 'any') query.set('date', params.date)
  return request<RedemptionListResponse>(
    `/api/redemptions?${query.toString()}`,
    { method: 'GET' },
    'Unable to load redemptions',
  )
}

export function getRedemptionApi(id: string): Promise<Redemption> {
  return request<Redemption>(
    `/api/redemptions/${id}`,
    { method: 'GET' },
    'Unable to load redemption',
  )
}

export function createRedemptionApi(body: {
  memberId: string
  merchantId: string
  offerId: string
  redeemedAt?: string
  status?: RedemptionStatus
  method?: string
}): Promise<Redemption> {
  return request<Redemption>(
    '/api/redemptions',
    { method: 'POST', body: JSON.stringify(body) },
    'Unable to create redemption',
  )
}

export function updateRedemptionApi(
  id: string,
  body: Partial<{
    memberId: string
    merchantId: string
    offerId: string
    redeemedAt: string
    status: RedemptionStatus
    method: string
    verificationStatus: string
  }>,
): Promise<Redemption> {
  return request<Redemption>(
    `/api/redemptions/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) },
    'Unable to update redemption',
  )
}

export function updateRedemptionStatusApi(
  id: string,
  status: RedemptionStatus,
): Promise<Redemption> {
  return request<Redemption>(
    `/api/redemptions/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    'Unable to update redemption status',
  )
}
