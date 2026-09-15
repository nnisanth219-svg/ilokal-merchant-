import type { Offer, OfferFormValues, OfferStatus } from '../types/offer'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('VITE_API_URL is not configured')
}

interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

interface ApiFailure {
  success: false
  message: string
}

export interface OfferListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: OfferStatus | 'all' | 'deleted'
  merchantId?: string
  category?: string
  offerType?: string
  date?: 'any' | '30d' | '90d' | 'year'
  includeDeleted?: boolean
}

export interface OfferListResponse {
  offers: Offer[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    live: number
    scheduled: number
    expired: number
    usageTotal: number
  }
}

export interface OfferMerchantOption {
  id: string
  name: string
  category: string
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
  const response = await fetch(`${API_URL}${path}`, {
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

function formToBody(values: OfferFormValues) {
  return {
    merchantId: values.merchantId,
    title: values.title.trim(),
    description: values.description.trim(),
    offerType: values.offerType,
    benefitValue: values.benefitValue.trim(),
    eligibility: values.eligibility.trim(),
    validFrom: values.validFrom,
    validTo: values.validTo,
    redemptionLimit: values.redemptionLimit.trim(),
    status: values.status,
  }
}

export function listOffersApi(params: OfferListParams = {}): Promise<OfferListResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('pageSize', String(params.pageSize ?? 25))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.merchantId && params.merchantId !== 'all') {
    query.set('merchantId', params.merchantId)
  }
  if (params.category && params.category !== 'all') query.set('category', params.category)
  if (params.offerType && params.offerType !== 'all') query.set('offerType', params.offerType)
  if (params.date && params.date !== 'any') query.set('date', params.date)
  if (params.includeDeleted) query.set('includeDeleted', 'true')
  return request<OfferListResponse>(
    `/api/offers?${query.toString()}`,
    { method: 'GET' },
    'Unable to load offers',
  )
}

export function getOfferApi(id: string, includeDeleted = false): Promise<Offer> {
  const q = includeDeleted ? '?includeDeleted=true' : ''
  return request<Offer>(`/api/offers/${id}${q}`, { method: 'GET' }, 'Unable to load offer')
}

export function listOfferMerchantsApi(): Promise<OfferMerchantOption[]> {
  return request<OfferMerchantOption[]>(
    '/api/offers/meta/merchants',
    { method: 'GET' },
    'Unable to load merchants',
  )
}

export function createOfferApi(values: OfferFormValues): Promise<Offer> {
  return request<Offer>(
    '/api/offers',
    { method: 'POST', body: JSON.stringify(formToBody(values)) },
    'Unable to create offer',
  )
}

export function updateOfferApi(id: string, values: OfferFormValues): Promise<Offer> {
  return request<Offer>(
    `/api/offers/${id}`,
    { method: 'PATCH', body: JSON.stringify(formToBody(values)) },
    'Unable to update offer',
  )
}

export function updateOfferStatusApi(id: string, status: OfferStatus): Promise<Offer> {
  return request<Offer>(
    `/api/offers/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    'Unable to update offer status',
  )
}

export function softDeleteOfferApi(id: string): Promise<Offer> {
  return request<Offer>(`/api/offers/${id}`, { method: 'DELETE' }, 'Unable to delete offer')
}

export function restoreOfferApi(id: string): Promise<Offer> {
  return request<Offer>(
    `/api/offers/${id}/restore`,
    { method: 'PATCH' },
    'Unable to restore offer',
  )
}

export function duplicateOfferApi(id: string): Promise<Offer> {
  return request<Offer>(
    `/api/offers/${id}/duplicate`,
    { method: 'POST' },
    'Unable to duplicate offer',
  )
}

export function bulkUpdateOfferStatusApi(
  ids: string[],
  status: OfferStatus,
): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/offers/bulk/status',
    { method: 'POST', body: JSON.stringify({ ids, status }) },
    'Unable to update offers',
  )
}

export function bulkSoftDeleteOffersApi(ids: string[]): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/offers/bulk/delete',
    { method: 'POST', body: JSON.stringify({ ids }) },
    'Unable to delete offers',
  )
}
