import type { AuthErrorResponse, AuthSuccessResponse, AuthUser } from '../types/auth'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('VITE_API_URL is not configured')
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

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
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
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  })

  if (response.status === 401) {
    return null
  }

  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to verify session'))
  }

  const data = payload as AuthSuccessResponse
  return data.user ?? null
}

export async function logoutRequest(): Promise<void> {
  const response = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = (await parseJson(response)) as AuthErrorResponse | null
    throw new Error(getErrorMessage(payload, 'Unable to log out'))
  }
}
