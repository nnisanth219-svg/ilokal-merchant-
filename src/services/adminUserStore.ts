import { rolePermissionMatrices } from '../data/adminUsers'
import type { AdminRole, RolePermissionMatrix } from '../types/adminUser'

/** Fallback role matrices for pages that have not yet migrated to listAdminRolesApi. */
export function getRoleMatrices(): RolePermissionMatrix[] {
  return rolePermissionMatrices
}

export function countUsersByRole(role: AdminRole): number {
  return rolePermissionMatrices.find((m) => m.role === role)?.userCount ?? 0
}
