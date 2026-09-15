import type { AuthSuccessResponse, AuthUser } from '../types/auth'
import { apiFetch, getApiBaseUrl, requireApiBaseUrl } from './apiConfig'
import { clearAuthToken, setAuthToken } from './authToken'

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

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const apiUrl = requireApiBaseUrl()
  const response = await apiFetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Invalid email or password'))
  }

  const data = payload as AuthSuccessResponse
  if (!data.success || !data.user) {
    throw new Error('Unexpected login response')
  }

  if (typeof data.token === 'string' && data.token) {
    setAuthToken(data.token)
  }

  return data.user
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const apiUrl = getApiBaseUrl()
  if (!apiUrl) {
    return null
  }

  try {
    const response = await apiFetch(`${apiUrl}/api/auth/me`, {
      method: 'GET',
    })

    if (response.status === 401) {
      clearAuthToken()
      return null
    }

    const payload = await parseJson(response)

    if (!response.ok) {
      return null
    }

    const data = payload as AuthSuccessResponse
    return data.user ?? null
  } catch {
    return null
  }
}

export async function logoutRequest(): Promise<void> {
  const apiUrl = getApiBaseUrl()
  if (!apiUrl) {
    clearAuthToken()
    return
  }

  try {
    await apiFetch(`${apiUrl}/api/auth/logout`, {
      method: 'POST',
    })
  } catch {
    // Client session is cleared even if the API is unreachable.
  } finally {
    clearAuthToken()
  }
}
