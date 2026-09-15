/** Public API origin. Empty when VITE_API_URL was not set at build time. */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL
  if (typeof raw !== 'string') return ''
  return raw.trim().replace(/\/+$/, '')
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
