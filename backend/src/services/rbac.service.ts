import { prisma } from '../lib/prisma.js'
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  ROLE_DESCRIPTIONS,
  permissionKey,
  type PermissionActionName,
  type PermissionGrant,
  type PermissionModuleName,
} from '../lib/permissions.js'
import { SUPER_ADMIN_ROLE } from '../types/auth.js'
import { AppError } from '../utils/errors.js'

export async function ensurePermissionsCatalog(): Promise<void> {
  for (const module of PERMISSION_MODULES) {
    for (const action of PERMISSION_ACTIONS) {
      await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {
          description: `${action} access for ${module}`,
        },
        create: {
          module,
          action,
          description: `${action} access for ${module}`,
        },
      })
    }
  }
}

export async function ensureRolePermissionDefaults(forceReset = false): Promise<void> {
  await ensurePermissionsCatalog()

  for (const [roleCode, matrix] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleCode },
      update: { description: ROLE_DESCRIPTIONS[roleCode] ?? '' },
      create: {
        name: roleCode,
        description: ROLE_DESCRIPTIONS[roleCode] ?? '',
      },
    })

    const existingCount = await prisma.rolePermission.count({ where: { roleId: role.id } })
    if (existingCount > 0 && !forceReset) continue

    if (forceReset) {
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    }

    const wanted: { module: string; action: string }[] = []
    for (const module of PERMISSION_MODULES) {
      for (const action of matrix[module] ?? []) {
        wanted.push({ module, action })
      }
    }

    for (const item of wanted) {
      const permission = await prisma.permission.findUnique({
        where: { module_action: { module: item.module, action: item.action } },
      })
      if (!permission) continue
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      })
    }
  }
}

export async function getPermissionsForRoleId(roleId: string): Promise<PermissionGrant[]> {
  const rows = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  })
  return rows.map((row) => ({
    module: row.permission.module,
    action: row.permission.action,
  }))
}

export async function getPermissionsForRoleCode(roleCode: string): Promise<PermissionGrant[]> {
  const role = await prisma.role.findUnique({ where: { name: roleCode } })
  if (!role) return []
  return getPermissionsForRoleId(role.id)
}

export async function getPermissionsForUserId(userId: string): Promise<PermissionGrant[]> {
  const overrideCount = await prisma.userPermission.count({ where: { userId } })
  if (overrideCount > 0) {
    const rows = await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    })
    return rows.map((row) => ({
      module: row.permission.module,
      action: row.permission.action,
    }))
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roleId: true },
  })
  if (!user) return []
  return getPermissionsForRoleId(user.roleId)
}

export async function clearUserPermissions(userId: string): Promise<void> {
  await prisma.userPermission.deleteMany({ where: { userId } })
}

export async function replaceUserPermissions(
  userId: string,
  permissions: Record<string, string[]>,
): Promise<Record<PermissionModuleName, PermissionActionName[]>> {
  await ensurePermissionsCatalog()
  await prisma.userPermission.deleteMany({ where: { userId } })

  for (const module of PERMISSION_MODULES) {
    const actions = permissions[module] ?? []
    for (const action of actions) {
      if (!(PERMISSION_ACTIONS as readonly string[]).includes(action)) continue
      const permission = await prisma.permission.findUnique({
        where: { module_action: { module, action } },
      })
      if (!permission) continue
      await prisma.userPermission.create({
        data: { userId, permissionId: permission.id },
      })
    }
  }

  const grants = await getPermissionsForUserId(userId)
  return matrixFromGrants(grants)
}

export function hasPermissionGrant(
  roleCode: string,
  grants: PermissionGrant[],
  module: string,
  action: string,
): boolean {
  if (roleCode === SUPER_ADMIN_ROLE) return true
  const key = permissionKey(module, action)
  return grants.some((g) => permissionKey(g.module, g.action) === key)
}

export async function userHasPermission(
  userId: string,
  module: string,
  action: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })
  if (!user || user.deletedAt || !user.isActive || user.status !== 'active') {
    return false
  }
  if (user.role.name === SUPER_ADMIN_ROLE) return true
  const grants = await getPermissionsForUserId(userId)
  return hasPermissionGrant(user.role.name, grants, module, action)
}

export function matrixFromGrants(
  grants: PermissionGrant[],
): Record<PermissionModuleName, PermissionActionName[]> {
  const matrix = Object.fromEntries(
    PERMISSION_MODULES.map((m) => [m, [] as PermissionActionName[]]),
  ) as Record<PermissionModuleName, PermissionActionName[]>

  for (const grant of grants) {
    if (!(PERMISSION_MODULES as readonly string[]).includes(grant.module)) continue
    if (!(PERMISSION_ACTIONS as readonly string[]).includes(grant.action)) continue
    const module = grant.module as PermissionModuleName
    const action = grant.action as PermissionActionName
    if (!matrix[module].includes(action)) matrix[module].push(action)
  }
  return matrix
}

export async function replaceRolePermissions(
  roleCode: string,
  permissions: Record<string, string[]>,
): Promise<Record<PermissionModuleName, PermissionActionName[]>> {
  if (roleCode === SUPER_ADMIN_ROLE) {
    throw new AppError(400, 'Super Admin permissions cannot be modified')
  }

  const role = await prisma.role.findUnique({ where: { name: roleCode } })
  if (!role) throw new AppError(404, 'Role not found')

  await ensurePermissionsCatalog()
  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })

  for (const module of PERMISSION_MODULES) {
    const actions = permissions[module] ?? []
    for (const action of actions) {
      if (!(PERMISSION_ACTIONS as readonly string[]).includes(action)) continue
      const permission = await prisma.permission.findUnique({
        where: { module_action: { module, action } },
      })
      if (!permission) continue
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: permission.id },
      })
    }
  }

  const grants = await getPermissionsForRoleId(role.id)
  return matrixFromGrants(grants)
}
