import type { AppSettingsState, SettingKey } from '../types/settings'

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

export function getSettingsApi(): Promise<AppSettingsState> {
  return request<AppSettingsState>('/api/settings', { method: 'GET' }, 'Unable to load settings')
}

export function getSettingSectionApi(
  key: SettingKey,
): Promise<AppSettingsState[SettingKey]> {
  return request<AppSettingsState[SettingKey]>(
    `/api/settings/${key}`,
    { method: 'GET' },
    'Unable to load settings',
  )
}

export function updateSettingSectionApi<K extends SettingKey>(
  key: K,
  value: AppSettingsState[K],
): Promise<AppSettingsState[K]> {
  return request<AppSettingsState[K]>(
    `/api/settings/${key}`,
    { method: 'PATCH', body: JSON.stringify(value) },
    'Unable to save settings',
  )
}

export function updateSettingsApi(
  partial: Partial<AppSettingsState>,
): Promise<AppSettingsState> {
  return request<AppSettingsState>(
    '/api/settings',
    { method: 'PATCH', body: JSON.stringify(partial) },
    'Unable to save settings',
  )
}
