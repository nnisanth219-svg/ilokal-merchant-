import type { ReviewItem, ReviewStatus } from '../types/review'
import { apiFetch, requireApiBaseUrl } from './apiConfig'

interface ApiSuccess<T> {
  success: true
  data: T
}

interface ApiFailure {
  success: false
  message: string
}

export interface ReviewListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: ReviewStatus | 'all'
  rating?: string
  merchantId?: string
  memberId?: string
  date?: 'any' | '7d' | '30d' | '90d'
}

export interface ReviewListResponse {
  reviews: ReviewItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    averageRating: number
    fiveStar: number
    needsAttention: number
  }
  filterOptions: {
    merchants: { id: string; name: string }[]
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

export function listReviewsApi(params: ReviewListParams = {}): Promise<ReviewListResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('pageSize', String(params.pageSize ?? 25))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.rating && params.rating !== 'all') query.set('rating', params.rating)
  if (params.merchantId && params.merchantId !== 'all') {
    query.set('merchantId', params.merchantId)
  }
  if (params.memberId && params.memberId !== 'all') query.set('memberId', params.memberId)
  if (params.date && params.date !== 'any') query.set('date', params.date)
  return request<ReviewListResponse>(
    `/api/reviews?${query.toString()}`,
    { method: 'GET' },
    'Unable to load reviews',
  )
}

export function getReviewApi(id: string): Promise<ReviewItem> {
  return request<ReviewItem>(`/api/reviews/${id}`, { method: 'GET' }, 'Unable to load review')
}

export function createReviewApi(body: {
  memberId: string
  merchantId: string
  rating: number
  text?: string
  status?: ReviewStatus
  submittedAt?: string
}): Promise<ReviewItem> {
  return request<ReviewItem>(
    '/api/reviews',
    { method: 'POST', body: JSON.stringify(body) },
    'Unable to create review',
  )
}

export function updateReviewApi(
  id: string,
  body: Partial<{
    memberId: string
    merchantId: string
    rating: number
    text: string
    status: ReviewStatus
    submittedAt: string
  }>,
): Promise<ReviewItem> {
  return request<ReviewItem>(
    `/api/reviews/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) },
    'Unable to update review',
  )
}

export function updateReviewStatusApi(id: string, status: ReviewStatus): Promise<ReviewItem> {
  return request<ReviewItem>(
    `/api/reviews/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    'Unable to update review status',
  )
}

export function softDeleteReviewApi(id: string): Promise<ReviewItem> {
  return request<ReviewItem>(`/api/reviews/${id}`, { method: 'DELETE' }, 'Unable to delete review')
}

export function bulkUpdateReviewStatusApi(
  ids: string[],
  status: ReviewStatus,
): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/reviews/bulk/status',
    { method: 'POST', body: JSON.stringify({ ids, status }) },
    'Unable to update reviews',
  )
}

export function bulkSoftDeleteReviewsApi(ids: string[]): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/reviews/bulk/delete',
    { method: 'POST', body: JSON.stringify({ ids }) },
    'Unable to delete reviews',
  )
}
