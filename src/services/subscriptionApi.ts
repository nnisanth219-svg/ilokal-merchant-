import type {
  BillingCycle,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../types/subscription'
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

export type ExpiryFilter = 'any' | '7d' | '30d' | '90d'

export interface SubscriptionListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: SubscriptionStatus | 'all'
  plan?: SubscriptionPlan | 'all'
  billing?: BillingCycle | 'all'
  expiry?: ExpiryFilter
  memberId?: string
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    active: number
    expiringSoon: number
    expired: number
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

export function listSubscriptionsApi(
  params: SubscriptionListParams = {},
): Promise<SubscriptionListResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('pageSize', String(params.pageSize ?? 25))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.plan && params.plan !== 'all') query.set('plan', params.plan)
  if (params.billing && params.billing !== 'all') query.set('billing', params.billing)
  if (params.expiry && params.expiry !== 'any') query.set('expiry', params.expiry)
  if (params.memberId) query.set('memberId', params.memberId)
  return request<SubscriptionListResponse>(
    `/api/subscriptions?${query.toString()}`,
    { method: 'GET' },
    'Unable to load subscriptions',
  )
}

export function getSubscriptionApi(id: string): Promise<Subscription> {
  return request<Subscription>(
    `/api/subscriptions/${id}`,
    { method: 'GET' },
    'Unable to load subscription',
  )
}

export function createSubscriptionApi(body: {
  memberId: string
  plan: SubscriptionPlan
  billing?: BillingCycle
  startDate: string
  expiryDate: string
  status?: SubscriptionStatus
  amount?: number
}): Promise<Subscription> {
  return request<Subscription>(
    '/api/subscriptions',
    { method: 'POST', body: JSON.stringify(body) },
    'Unable to create subscription',
  )
}

export function updateSubscriptionApi(
  id: string,
  body: Partial<{
    memberId: string
    plan: SubscriptionPlan
    billing: BillingCycle
    startDate: string
    expiryDate: string
    status: SubscriptionStatus
    amount: number
  }>,
): Promise<Subscription> {
  return request<Subscription>(
    `/api/subscriptions/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) },
    'Unable to update subscription',
  )
}

export function updateSubscriptionStatusApi(
  id: string,
  status: SubscriptionStatus,
): Promise<Subscription> {
  return request<Subscription>(
    `/api/subscriptions/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    'Unable to update subscription status',
  )
}

export function renewSubscriptionApi(id: string): Promise<Subscription> {
  return request<Subscription>(
    `/api/subscriptions/${id}/renew`,
    { method: 'POST' },
    'Unable to renew subscription',
  )
}

export function bulkUpdateSubscriptionStatusApi(
  ids: string[],
  status: SubscriptionStatus,
): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/subscriptions/bulk/status',
    { method: 'POST', body: JSON.stringify({ ids, status }) },
    'Unable to update subscriptions',
  )
}
