export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN' as const
export const ADMIN_ROLE = 'ADMIN' as const
export const OPERATIONS_ROLE = 'OPERATIONS' as const

export const PORTAL_ROLES = [SUPER_ADMIN_ROLE, ADMIN_ROLE, OPERATIONS_ROLE] as const

export type PortalRole = (typeof PORTAL_ROLES)[number]

export interface AuthPermission {
  module: string
  action: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  roleLabel: string
  permissions: AuthPermission[]
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
  token?: string
}

export interface ApiErrorResponse {
  success: false
  message: string
}

export function roleLabelFromCode(role: string): string {
  if (role === SUPER_ADMIN_ROLE) return 'Super Admin'
  if (role === ADMIN_ROLE) return 'Admin'
  if (role === OPERATIONS_ROLE) return 'Operations'
  return role
}
