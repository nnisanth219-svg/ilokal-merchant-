import type {
  PermissionAction,
  PermissionModule,
  RolePermissionMatrix,
} from '../types/adminUser'
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from '../types/adminUser'

function allPermissions(): Record<PermissionModule, PermissionAction[]> {
  return Object.fromEntries(
    PERMISSION_MODULES.map((m) => [m, [...PERMISSION_ACTIONS]]),
  ) as Record<PermissionModule, PermissionAction[]>
}

function subset(
  modules: Partial<Record<PermissionModule, PermissionAction[]>>,
): Record<PermissionModule, PermissionAction[]> {
  const base = Object.fromEntries(
    PERMISSION_MODULES.map((m) => [m, [] as PermissionAction[]]),
  ) as Record<PermissionModule, PermissionAction[]>
  for (const [key, value] of Object.entries(modules)) {
    base[key as PermissionModule] = value ?? []
  }
  return base
}

/** Optional static fallback when roles API is unavailable (e.g. Settings stub). */
export const rolePermissionMatrices: RolePermissionMatrix[] = [
  {
    role: 'Super Admin',
    description: 'Full platform access across every module and configuration.',
    permissions: allPermissions(),
  },
  {
    role: 'Admin',
    description: 'Day-to-day CMS management without platform-wide security controls.',
    permissions: subset({
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
    }),
  },
  {
    role: 'Operations',
    description: 'Operational monitoring focused on merchants, offers and redemptions.',
    permissions: subset({
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
    }),
  },
]
