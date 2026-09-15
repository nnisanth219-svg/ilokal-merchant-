import type { CategoryFormValues, CategoryItem, CategoryStatus } from '../types/category'
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

export interface CategoryListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: CategoryStatus | 'all' | 'deleted'
  includeDeleted?: boolean
}

export interface CategoryListResponse {
  categories: CategoryItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    active: number
    withMerchants: number
    empty: number
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

export function listCategoriesApi(
  params: CategoryListParams = {},
): Promise<CategoryListResponse> {
  const query = new URLSearchParams()
  query.set('page', String(params.page ?? 1))
  query.set('pageSize', String(params.pageSize ?? 25))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.includeDeleted) query.set('includeDeleted', 'true')
  return request<CategoryListResponse>(
    `/api/categories?${query.toString()}`,
    { method: 'GET' },
    'Unable to load categories',
  )
}

export function getCategoryApi(id: string, includeDeleted = false): Promise<CategoryItem> {
  const q = includeDeleted ? '?includeDeleted=true' : ''
  return request<CategoryItem>(
    `/api/categories/${id}${q}`,
    { method: 'GET' },
    'Unable to load category',
  )
}

export function createCategoryApi(values: CategoryFormValues): Promise<CategoryItem> {
  return request<CategoryItem>(
    '/api/categories',
    {
      method: 'POST',
      body: JSON.stringify({
        name: values.name.trim(),
        description: values.description.trim(),
        status: values.status,
        displayOrder: values.displayOrder,
      }),
    },
    'Unable to create category',
  )
}

export function updateCategoryApi(
  id: string,
  values: CategoryFormValues,
): Promise<CategoryItem> {
  return request<CategoryItem>(
    `/api/categories/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        name: values.name.trim(),
        description: values.description.trim(),
        status: values.status,
        displayOrder: values.displayOrder,
      }),
    },
    'Unable to update category',
  )
}

export function updateCategoryStatusApi(
  id: string,
  status: Exclude<CategoryStatus, 'deleted'>,
): Promise<CategoryItem> {
  return request<CategoryItem>(
    `/api/categories/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    'Unable to update category status',
  )
}

export function softDeleteCategoryApi(id: string): Promise<CategoryItem> {
  return request<CategoryItem>(
    `/api/categories/${id}`,
    { method: 'DELETE' },
    'Unable to delete category',
  )
}

export function restoreCategoryApi(id: string): Promise<CategoryItem> {
  return request<CategoryItem>(
    `/api/categories/${id}/restore`,
    { method: 'PATCH' },
    'Unable to restore category',
  )
}

export function bulkUpdateCategoryStatusApi(
  ids: string[],
  status: Exclude<CategoryStatus, 'deleted'>,
): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/categories/bulk/status',
    { method: 'POST', body: JSON.stringify({ ids, status }) },
    'Unable to update categories',
  )
}

export function bulkSoftDeleteCategoriesApi(ids: string[]): Promise<{ count: number }> {
  return request<{ count: number }>(
    '/api/categories/bulk/delete',
    { method: 'POST', body: JSON.stringify({ ids }) },
    'Unable to delete categories',
  )
}
