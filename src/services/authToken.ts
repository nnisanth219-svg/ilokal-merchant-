const AUTH_TOKEN_KEY = 'ilokal_access_token'
const KEEP_SIGNED_IN_KEY = 'ilokal_keep_signed_in'

function canUseStorage(): boolean {
  return typeof window !== 'undefined'
}

export function getKeepSignedInPreference(): boolean {
  if (!canUseStorage()) return true
  const stored = window.localStorage.getItem(KEEP_SIGNED_IN_KEY)
  if (stored === 'false') return false
  if (stored === 'true') return true
  return true
}

export function setKeepSignedInPreference(value: boolean): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(KEEP_SIGNED_IN_KEY, value ? 'true' : 'false')
}

export function getAuthToken(): string | null {
  if (!canUseStorage()) return null
  const persistent = window.localStorage.getItem(AUTH_TOKEN_KEY)
  if (persistent && persistent.trim()) return persistent
  const session = window.sessionStorage.getItem(AUTH_TOKEN_KEY)
  return session && session.trim() ? session : null
}

export function setAuthToken(token: string, persist = getKeepSignedInPreference()): void {
  if (!canUseStorage()) return
  if (persist) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token)
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY)
  } else {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, token)
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

export function clearAuthToken(): void {
  if (!canUseStorage()) return
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY)
}
