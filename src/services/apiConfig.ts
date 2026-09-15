import { getAuthToken } from './authToken'

/** Public API origin. Empty when VITE_API_URL was not set at build time. */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL
  if (typeof raw !== 'string') return ''
  return raw.trim().replace(/\/+$/, '')
}

/** Cookie + Bearer session fetch for every authenticated API call. */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getAuthToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  })
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0
}

/** Call only when making a request — never at module load. */
export function requireApiBaseUrl(): string {
  const url = getApiBaseUrl()
  if (!url) {
    throw new Error('The API is not configured. Set VITE_API_URL and rebuild the frontend.')
  }
  return url
}
