export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthSuccessResponse {
  success: true
  message?: string
  user: AuthUser
}

export interface AuthErrorResponse {
  success: false
  message: string
}

export type LoginErrorCode =
  | 'invalid_credentials'
  | 'account_locked'
  | 'role_revoked'
  | 'session_expired'
  | 'two_factor_required'

export interface LoginFormValues {
  email: string
  password: string
  keepSignedIn: boolean
}

export interface LoginFormErrors {
  email?: string
  password?: string
}

export interface AuthErrorState {
  code: LoginErrorCode
  message: string
}
