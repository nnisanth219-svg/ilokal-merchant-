import type {
  ApiFailure,
  ApiSuccess,
  DashboardActivityItem,
  DashboardChartData,
  DashboardStats,
} from '../types/dashboard'
import { requireApiBaseUrl } from './apiConfig'

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

async function getDashboardResource<T>(path: string, fallbackError: string): Promise<T> {
  const response = await fetch(`${requireApiBaseUrl()}${path}`, {
    method: 'GET',
    credentials: 'include',
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

export function getDashboardStats(): Promise<DashboardStats> {
  return getDashboardResource<DashboardStats>(
    '/api/dashboard/stats',
    'Unable to load statistics',
  )
}

export function getDashboardRedemptions(): Promise<DashboardChartData> {
  return getDashboardResource<DashboardChartData>(
    '/api/dashboard/redemptions',
    'Unable to load chart data',
  )
}

export function getDashboardActivity(): Promise<DashboardActivityItem[]> {
  return getDashboardResource<DashboardActivityItem[]>(
    '/api/dashboard/activity',
    'Unable to load recent activity',
  )
}
