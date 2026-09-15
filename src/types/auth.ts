export interface AuthPermission {
  module: string
  action: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  roleLabel?: string
  permissions?: AuthPermission[]
}

export interface AuthSuccessResponse {
  success: true
  message?: string
  user: AuthUser
  token?: string
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

export type CrmModule =
  | 'Dashboard'
  | 'Members'
  | 'Merchants'
  | 'Offers'
  | 'Subscriptions'
  | 'Redemptions'
  | 'Reviews'
  | 'Categories'
  | 'Admin Users'
  | 'Settings'
  | 'Audit Log'

export type CrmAction = 'view' | 'create' | 'edit' | 'delete' | 'manage'

export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'

export function hasPermission(
  user: AuthUser | null | undefined,
  module: string,
  action: string,
): boolean {
  if (!user) return false
  if (user.role === SUPER_ADMIN_ROLE) return true
  return (user.permissions ?? []).some(
    (p) => p.module === module && p.action === action,
  )
}

export function canViewModule(user: AuthUser | null | undefined, module: string): boolean {
  return hasPermission(user, module, 'view')
}

/** Create button / invite / duplicate */
export function canCreateInModule(user: AuthUser | null | undefined, module: string): boolean {
  return (
    hasPermission(user, module, 'create') || hasPermission(user, module, 'manage')
  )
}

/** Edit forms, activate/deactivate/status (matches backend edit|manage) */
export function canEditInModule(user: AuthUser | null | undefined, module: string): boolean {
  return hasPermission(user, module, 'edit') || hasPermission(user, module, 'manage')
}

/** Soft delete / restore / bulk delete (matches backend delete|manage) */
export function canDeleteInModule(user: AuthUser | null | undefined, module: string): boolean {
  return (
    hasPermission(user, module, 'delete') || hasPermission(user, module, 'manage')
  )
}

export function canManageInModule(user: AuthUser | null | undefined, module: string): boolean {
  return hasPermission(user, module, 'manage')
}
