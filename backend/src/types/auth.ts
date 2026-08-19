export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN' as const

export type AdminRole = typeof SUPER_ADMIN_ROLE

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export interface JwtPayload {
  sub: string
  role: string
}

export interface ApiSuccessResponse<T> {
  success: true
  message?: string
  data?: T
  user?: AuthUser
}

export interface ApiErrorResponse {
  success: false
  message: string
}
