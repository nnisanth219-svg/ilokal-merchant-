import type { AuthSuccessResponse, AuthUser } from '../types/auth'
import { getApiBaseUrl, requireApiBaseUrl } from './apiConfig'

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
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
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

  return data.user
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const apiUrl = getApiBaseUrl()
  if (!apiUrl) {
    return null
  }

  try {
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      method: 'GET',
      credentials: 'include',
    })

    if (response.status === 401) {
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
    return
  }

  try {
    await fetch(`${apiUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // Client session is cleared even if the API is unreachable.
  }
}
