import type { Merchant, MerchantFormValues, MerchantStatus } from '../types/merchant'
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

export interface MerchantListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: MerchantStatus | 'all'
  category?: string
  state?: string
  added?: 'any' | '7d' | '30d' | '90d'
  includeDeleted?: boolean
}

export interface MerchantListResponse {
  merchants: Merchant[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  liveCount: number
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
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  const payload = await parseJson(response)
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallbackError))
  }

  const data = payload as ApiSuccess<T> | ApiFailure
  if (!data || typeof data !== 'object' || !('success' in data) || !data.success) {
    throw new Error(fallbackError)
  }

  return data.data
}

function formToBody(values: MerchantFormValues) {
  return {
    businessName: values.businessName.trim(),
    legalName: values.legalName.trim(),
    category: values.category,
    subCategories: values.subCategories
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    description: values.description.trim(),
    registrationNo: values.registrationNo.trim(),
    priceRange: values.priceRange,
    phone: values.phone.trim(),
    email: values.email.trim(),
    whatsapp: values.whatsapp.trim() || values.phone.trim(),
    address: values.address.trim(),
    postcode: values.postcode.trim(),
    latitude: values.latitude.trim(),
    longitude: values.longitude.trim(),
    outletType: values.outletType,
    picName: values.picName.trim(),
    hoursWeekday: values.hoursWeekday,
    hoursWeekend: values.hoursWeekend,
    hoursHoliday: values.hoursHoliday,
    logoUrl: values.logoUrl,
    coverUrl: values.coverUrl,
    galleryUrls: values.galleryUrls,
    featured: values.featured,
    status: values.publishStatus,
    offerSummary: values.offerSummary.trim(),
  }
}

export function listMerchantsApi(params: MerchantListParams = {}): Promise<MerchantListResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('pageSize', String(params.pageSize ?? 25))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.category && params.category !== 'All') query.set('category', params.category)
  if (params.state && params.state !== 'All') query.set('state', params.state)
  if (params.added && params.added !== 'any') query.set('added', params.added)
  if (params.includeDeleted) query.set('includeDeleted', 'true')

  return request<MerchantListResponse>(
    `/api/merchants?${query.toString()}`,
    { method: 'GET' },
    'Unable to load merchants',
  )
}

export function getMerchantApi(id: string, includeDeleted = false): Promise<Merchant> {
  const q = includeDeleted ? '?includeDeleted=true' : ''
  return request<Merchant>(
    `/api/merchants/${id}${q}`,
    { method: 'GET' },
    'Unable to load merchant',
  )
}

export function createMerchantApi(values: MerchantFormValues): Promise<Merchant> {
  return request<Merchant>(
    '/api/merchants',
    { method: 'POST', body: JSON.stringify(formToBody(values)) },
    'Unable to create merchant',
  )
}

export function updateMerchantApi(id: string, values: MerchantFormValues): Promise<Merchant> {
  return request<Merchant>(
    `/api/merchants/${id}`,
    { method: 'PATCH', body: JSON.stringify(formToBody(values)) },
    'Unable to update merchant',
  )
}

export function updateMerchantStatusApi(
  id: string,
  status: 'active' | 'pending' | 'inactive',
): Promise<Merchant> {
  return request<Merchant>(
    `/api/merchants/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    'Unable to update merchant status',
  )
}

export function softDeleteMerchantApi(id: string): Promise<Merchant> {
  return request<Merchant>(
    `/api/merchants/${id}`,
    { method: 'DELETE' },
    'Unable to delete merchant',
  )
}

export function restoreMerchantApi(id: string): Promise<Merchant> {
  return request<Merchant>(
    `/api/merchants/${id}/restore`,
    { method: 'PATCH' },
    'Unable to restore merchant',
  )
}

export function bulkUpdateMerchantStatusApi(
  ids: string[],
  status: 'active' | 'pending' | 'inactive',
): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/merchants/bulk/status',
    { method: 'POST', body: JSON.stringify({ ids, status }) },
    'Unable to update merchants',
  )
}

export function bulkSoftDeleteMerchantsApi(ids: string[]): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/merchants/bulk/delete',
    { method: 'POST', body: JSON.stringify({ ids }) },
    'Unable to delete merchants',
  )
}

export function bulkChangeMerchantCategoryApi(
  ids: string[],
  category: string,
): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/merchants/bulk/category',
    { method: 'POST', body: JSON.stringify({ ids, category }) },
    'Unable to change category',
  )
}
