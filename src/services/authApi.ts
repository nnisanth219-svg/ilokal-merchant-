import type { AuthSuccessResponse, AuthUser } from '../types/auth'
import { apiFetch, getApiBaseUrl, requireApiBaseUrl } from './apiConfig'
import {
  clearAuthToken,
  setAuthToken,
  setKeepSignedInPreference,
} from './authToken'

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

export async function loginRequest(
  email: string,
  password: string,
  keepSignedIn = false,
): Promise<AuthUser> {
  const apiUrl = requireApiBaseUrl()
  const response = await apiFetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, keepSignedIn }),
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Invalid email or password'))
  }

  const data = payload as AuthSuccessResponse
  if (!data.success || !data.user) {
    throw new Error('Unexpected login response')
  }

  setKeepSignedInPreference(keepSignedIn)
  if (typeof data.token === 'string' && data.token) {
    setAuthToken(data.token, keepSignedIn)
  }

  return data.user
}

export async function forgotPasswordRequest(email: string): Promise<{
  emailConfigured: boolean
  message: string
}> {
  const apiUrl = requireApiBaseUrl()
  const response = await apiFetch(`${apiUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const payload = await parseJson(response)
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to request a password reset'))
  }
  const data = payload as {
    success: boolean
    message?: string
    data?: { emailConfigured?: boolean }
  }
  return {
    emailConfigured: Boolean(data.data?.emailConfigured),
    message:
      data.message ??
      (data.data?.emailConfigured
        ? 'If an account exists for that email, a reset link has been sent.'
        : 'Password reset email cannot be sent because email delivery is not configured.'),
  }
}

export async function resetPasswordRequest(token: string, password: string): Promise<void> {
  const apiUrl = requireApiBaseUrl()
  const response = await apiFetch(`${apiUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })
  const payload = await parseJson(response)
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to reset password'))
  }
}

export async function fetchInviteInfo(token: string): Promise<{ email: string; name: string }> {
  const apiUrl = requireApiBaseUrl()
  const response = await apiFetch(
    `${apiUrl}/api/auth/invite-info?token=${encodeURIComponent(token)}`,
    { method: 'GET' },
  )
  const payload = await parseJson(response)
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'This invitation is invalid or has expired'))
  }
  const data = payload as { success: boolean; data?: { email: string; name: string } }
  if (!data.data?.email) {
    throw new Error('This invitation is invalid or has expired')
  }
  return data.data
}

export async function acceptInviteRequest(token: string, password: string): Promise<AuthUser> {
  const apiUrl = requireApiBaseUrl()
  const response = await apiFetch(`${apiUrl}/api/auth/accept-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })
  const payload = await parseJson(response)
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to accept invitation'))
  }
  const data = payload as AuthSuccessResponse
  if (!data.success || !data.user) {
    throw new Error('Unexpected invitation response')
  }
  setKeepSignedInPreference(false)
  if (typeof data.token === 'string' && data.token) {
    setAuthToken(data.token, false)
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
