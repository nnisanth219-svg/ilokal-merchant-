export type AdminRole = 'Super Admin' | 'Admin' | 'Operations'
export type AdminUserStatus = 'active' | 'pending' | 'inactive'

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

export interface AdminUser {
  id: string
  fullName: string
  email: string
  role: AdminRole
  status: AdminUserStatus
  lastActiveLabel: string
  createdAt: string
}

export interface RolePermissionMatrix {
  role: AdminRole
  description: string
  permissions: Record<PermissionModule, PermissionAction[]>
}

export const ADMIN_ROLE_OPTIONS: AdminRole[] = ['Super Admin', 'Admin', 'Operations']

export const ADMIN_STATUS_FILTERS: { value: AdminUserStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
]

export const ADMIN_ROLE_FILTERS: { value: AdminRole | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Super Admin', label: 'Super Admin' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Operations', label: 'Operations' },
]

export const PERMISSION_MODULES: PermissionModule[] = [
  'Dashboard',
  'Members',
  'Merchants',
  'Offers',
  'Subscriptions',
  'Redemptions',
  'Reviews',
  'Categories',
  'Admin Users',
  'Settings',
  'Audit Log',
]

export const PERMISSION_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'manage',
]
