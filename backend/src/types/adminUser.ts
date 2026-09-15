export type AdminRoleCode = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATIONS'
export type AdminRoleLabel = 'Super Admin' | 'Admin' | 'Operations'
export type AdminUserStatusValue = 'active' | 'pending' | 'inactive' | 'deleted'

export interface AdminUserDto {
  id: string
  fullName: string
  email: string
  role: AdminRoleLabel
  roleCode: AdminRoleCode
  status: AdminUserStatusValue
  lastActiveLabel: string
  createdAt: string
  updatedAt: string
  invitedAt: string | null
  lastLoginAt: string | null
  deletedAt: string | null
}

export interface AdminUserListQuery {
  page: number
  pageSize: number
  search?: string
  status?: AdminUserStatusValue | 'all'
  role?: AdminRoleLabel | AdminRoleCode | 'all'
  includeDeleted?: boolean
  sortBy?: 'createdAt' | 'name' | 'email' | 'status' | 'lastLoginAt'
  sortOrder?: 'asc' | 'desc'
}

export interface AdminUserListResult {
  users: AdminUserDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    active: number
    pending: number
    inactive: number
  }
}

export interface AdminUserInviteInput {
  fullName: string
  email: string
  role: AdminRoleLabel | AdminRoleCode
}

export interface AdminUserWriteInput {
  fullName?: string
  email?: string
  role?: AdminRoleLabel | AdminRoleCode
  status?: Exclude<AdminUserStatusValue, 'deleted'>
  /** When set, replaces this user's effective permission overrides. */
  permissions?: Record<PermissionModule, PermissionAction[]>
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage'

export type PermissionModule =
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

export interface RolePermissionMatrixDto {
  role: AdminRoleLabel
  roleCode: AdminRoleCode
  description: string
  userCount: number
  permissions: Record<PermissionModule, PermissionAction[]>
  /** True when permissions come from user_permissions overrides rather than role defaults. */
  isCustom?: boolean
}
