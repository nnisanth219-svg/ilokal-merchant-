const AUTH_TOKEN_KEY = 'ilokal_access_token'

export function getAuthToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
  return token && token.trim() ? token : null
}

export function setAuthToken(token: string): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
}
