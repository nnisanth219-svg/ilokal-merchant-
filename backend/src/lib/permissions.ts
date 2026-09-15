export const PERMISSION_MODULES = [
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
] as const

export type PermissionModuleName = (typeof PERMISSION_MODULES)[number]

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'manage'] as const

export type PermissionActionName = (typeof PERMISSION_ACTIONS)[number]

export type PermissionKey = `${PermissionModuleName}:${PermissionActionName}`

export interface PermissionGrant {
  module: PermissionModuleName | string
  action: PermissionActionName | string
}

export function permissionKey(module: string, action: string): string {
  return `${module}:${action}`
}

export function allPermissionGrants(): PermissionGrant[] {
  const grants: PermissionGrant[] = []
  for (const module of PERMISSION_MODULES) {
    for (const action of PERMISSION_ACTIONS) {
      grants.push({ module, action })
    }
  }
  return grants
}

/** Default role → permission matrix matching the existing Admin Users UI. */
export const DEFAULT_ROLE_PERMISSIONS: Record<
  string,
  Partial<Record<PermissionModuleName, PermissionActionName[]>>
> = {
  SUPER_ADMIN: Object.fromEntries(
    PERMISSION_MODULES.map((m) => [m, [...PERMISSION_ACTIONS]]),
  ) as Record<PermissionModuleName, PermissionActionName[]>,
  ADMIN: {
    Dashboard: ['view'],
    Members: ['view', 'create', 'edit'],
    Merchants: ['view', 'create', 'edit', 'manage'],
    Offers: ['view', 'create', 'edit', 'delete'],
    Subscriptions: ['view', 'edit'],
    Redemptions: ['view'],
    Reviews: ['view', 'edit', 'manage'],
    Categories: ['view', 'create', 'edit'],
    'Admin Users': ['view'],
    Settings: ['view'],
    'Audit Log': ['view'],
  },
  OPERATIONS: {
    Dashboard: ['view'],
    Members: ['view'],
    Merchants: ['view', 'edit'],
    Offers: ['view', 'edit'],
    Subscriptions: ['view'],
    Redemptions: ['view'],
    Reviews: ['view', 'edit'],
    Categories: ['view'],
    'Admin Users': [],
    Settings: [],
    'Audit Log': ['view'],
  },
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: 'Full platform access across every module and configuration.',
  ADMIN: 'Day-to-day CMS management without platform-wide security controls.',
  OPERATIONS: 'Operational monitoring focused on merchants, offers and redemptions.',
}
