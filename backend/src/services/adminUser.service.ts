import bcrypt from 'bcrypt'
import { randomBytes } from 'node:crypto'
import type { Prisma, User, UserStatus } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type {
  AdminRoleCode,
  AdminUserDto,
  AdminUserInviteInput,
  AdminUserListQuery,
  AdminUserListResult,
  AdminUserWriteInput,
  RolePermissionMatrixDto,
} from '../types/adminUser.js'
import { ROLE_DESCRIPTIONS } from '../lib/permissions.js'
import {
  clearUserPermissions,
  ensureRolePermissionDefaults,
  getPermissionsForRoleCode,
  getPermissionsForUserId,
  matrixFromGrants,
  replaceRolePermissions,
  replaceUserPermissions,
} from './rbac.service.js'
import { AppError } from '../utils/errors.js'
import {
  isActiveFromStatus,
  toRoleCode,
  toRoleLabel,
} from '../validation/adminUser.validation.js'

type UserWithRole = User & { role: { name: string } }

function formatLastActiveLabel(row: User): string {
  if (row.status === 'pending') return 'Invitation pending'
  if (!row.lastLoginAt) return 'Never'
  const diffMs = Date.now() - row.lastLoginAt.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  const days = Math.floor(diffMs / dayMs)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function toDto(row: UserWithRole): AdminUserDto {
  const deleted = row.deletedAt != null
  return {
    id: row.id,
    fullName: row.name,
    email: row.email,
    role: toRoleLabel(row.role.name),
    roleCode: toRoleCode(row.role.name),
    status: deleted ? 'deleted' : row.status,
    lastActiveLabel: deleted ? 'Deleted' : formatLastActiveLabel(row),
    createdAt: row.createdAt.toISOString().slice(0, 10),
    updatedAt: row.updatedAt.toISOString(),
    invitedAt: row.invitedAt ? row.invitedAt.toISOString() : null,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  }
}

async function resolveRoleId(roleCode: AdminRoleCode): Promise<string> {
  const role = await prisma.role.findUnique({ where: { name: roleCode } })
  if (!role) throw new AppError(400, `Role ${roleCode} is not configured`)
  return role.id
}

async function countActiveSuperAdmins(excludeId?: string): Promise<number> {
  return prisma.user.count({
    where: {
      deletedAt: null,
      status: 'active',
      isActive: true,
      role: { name: 'SUPER_ADMIN' },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  })
}

async function assertCanChangeSuperAdminAccess(
  existing: UserWithRole,
  nextStatus?: UserStatus,
  nextRoleCode?: AdminRoleCode,
  softDeleting = false,
): Promise<void> {
  const currentlyProtected =
    existing.deletedAt == null &&
    existing.role.name === 'SUPER_ADMIN' &&
    existing.status === 'active' &&
    existing.isActive

  if (!currentlyProtected) return

  const demoting =
    softDeleting ||
    (nextStatus !== undefined && nextStatus !== 'active') ||
    (nextRoleCode !== undefined && nextRoleCode !== 'SUPER_ADMIN')

  if (!demoting) return

  const remaining = await countActiveSuperAdmins(existing.id)
  if (remaining < 1) {
    throw new AppError(
      400,
      'Cannot remove or deactivate the last active Super Admin',
    )
  }
}

function buildListWhere(query: AdminUserListQuery): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {}

  if (!query.includeDeleted) where.deletedAt = null

  if (query.status && query.status !== 'all') {
    if (query.status === 'deleted') {
      where.deletedAt = { not: null }
    } else {
      where.status = query.status
      if (!query.includeDeleted) where.deletedAt = null
    }
  }

  if (query.role && query.role !== 'all') {
    where.role = { name: toRoleCode(query.role) }
  }

  if (query.search?.trim()) {
    const q = query.search.trim()
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }

  return where
}

export async function listAdminUsers(
  query: AdminUserListQuery,
): Promise<AdminUserListResult> {
  const where = buildListWhere(query)
  const skip = (query.page - 1) * query.pageSize

  const sortBy = query.sortBy ?? 'createdAt'
  const sortOrder = query.sortOrder ?? 'desc'
  const orderBy: Prisma.UserOrderByWithRelationInput =
    sortBy === 'name'
      ? { name: sortOrder }
      : sortBy === 'email'
        ? { email: sortOrder }
        : sortBy === 'status'
          ? { status: sortOrder }
          : sortBy === 'lastLoginAt'
            ? { lastLoginAt: sortOrder }
            : { createdAt: sortOrder }

  const [total, rows, summaryTotal, active, pending, inactive] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { role: true },
      orderBy,
      skip,
      take: query.pageSize,
    }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, status: 'active' } }),
    prisma.user.count({ where: { deletedAt: null, status: 'pending' } }),
    prisma.user.count({ where: { deletedAt: null, status: 'inactive' } }),
  ])

  return {
    users: rows.map(toDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
    summary: {
      total: summaryTotal,
      active,
      pending,
      inactive,
    },
  }
}

export async function getAdminUserById(
  id: string,
  includeDeleted = false,
): Promise<AdminUserDto> {
  const row = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  })
  if (!row || (!includeDeleted && row.deletedAt)) {
    throw new AppError(404, 'Admin user not found')
  }
  return toDto(row)
}

export async function inviteAdminUser(
  input: AdminUserInviteInput,
): Promise<AdminUserDto> {
  const roleCode = toRoleCode(input.role)
  const email = input.email.trim().toLowerCase()
  const fullName = input.fullName.trim()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing && !existing.deletedAt) {
    throw new AppError(400, 'An admin user with this email already exists')
  }

  const roleId = await resolveRoleId(roleCode)
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12)
  const now = new Date()

  if (existing?.deletedAt) {
    const row = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: fullName,
        passwordHash,
        roleId,
        status: 'pending',
        isActive: false,
        invitedAt: now,
        lastLoginAt: null,
        deletedAt: null,
      },
      include: { role: true },
    })
    return toDto(row)
  }

  const row = await prisma.user.create({
    data: {
      name: fullName,
      email,
      passwordHash,
      roleId,
      status: 'pending',
      isActive: false,
      invitedAt: now,
    },
    include: { role: true },
  })
  return toDto(row)
}

export async function updateAdminUser(
  id: string,
  input: AdminUserWriteInput,
): Promise<AdminUserDto> {
  const existing = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Admin user not found')

  const nextRoleCode = input.role ? toRoleCode(input.role) : undefined
  const nextStatus = input.status

  await assertCanChangeSuperAdminAccess(existing, nextStatus, nextRoleCode)

  if (input.email && input.email.toLowerCase() !== existing.email) {
    const duplicate = await prisma.user.findFirst({
      where: {
        email: input.email.toLowerCase(),
        NOT: { id },
        deletedAt: null,
      },
    })
    if (duplicate) throw new AppError(400, 'An admin user with this email already exists')
  }

  const roleId = nextRoleCode ? await resolveRoleId(nextRoleCode) : undefined
  const status = nextStatus
  const isActive = status ? isActiveFromStatus(status) : undefined
  const roleChanged = Boolean(roleId) && roleId !== existing.roleId

  const row = await prisma.user.update({
    where: { id },
    data: {
      name: input.fullName,
      email: input.email?.toLowerCase(),
      roleId,
      status,
      isActive,
    },
    include: { role: true },
  })

  if (input.permissions) {
    if (row.role.name === 'SUPER_ADMIN') {
      await clearUserPermissions(id)
    } else {
      await replaceUserPermissions(id, input.permissions)
    }
  } else if (roleChanged) {
    // Inherit the new role’s defaults until a custom matrix is saved.
    await clearUserPermissions(id)
  }

  return toDto(row)
}

export async function updateAdminUserStatus(
  id: string,
  status: 'active' | 'pending' | 'inactive',
): Promise<AdminUserDto> {
  const existing = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Admin user not found')

  await assertCanChangeSuperAdminAccess(existing, status)

  const row = await prisma.user.update({
    where: { id },
    data: {
      status,
      isActive: isActiveFromStatus(status),
    },
    include: { role: true },
  })
  return toDto(row)
}

export async function softDeleteAdminUser(id: string): Promise<AdminUserDto> {
  const existing = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  })
  if (!existing) throw new AppError(404, 'Admin user not found')
  if (existing.deletedAt) throw new AppError(400, 'Admin user is already deleted')

  await assertCanChangeSuperAdminAccess(existing, 'inactive', undefined, true)

  const row = await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: 'inactive',
      isActive: false,
    },
    include: { role: true },
  })
  return toDto(row)
}

export async function restoreAdminUser(id: string): Promise<AdminUserDto> {
  const existing = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  })
  if (!existing) throw new AppError(404, 'Admin user not found')
  if (!existing.deletedAt) throw new AppError(400, 'Admin user is not deleted')

  const row = await prisma.user.update({
    where: { id },
    data: {
      deletedAt: null,
      status: 'inactive',
      isActive: false,
    },
    include: { role: true },
  })
  return toDto(row)
}

export async function bulkUpdateAdminUserStatus(
  ids: string[],
  status: 'active' | 'pending' | 'inactive',
): Promise<number> {
  if (ids.length === 0) return 0

  if (status !== 'active') {
    const targets = await prisma.user.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: { role: true },
    })
    for (const target of targets) {
      await assertCanChangeSuperAdminAccess(target, status)
    }
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: {
      status,
      isActive: isActiveFromStatus(status),
    },
  })
  return result.count
}

export async function bulkSoftDeleteAdminUsers(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0

  const targets = await prisma.user.findMany({
    where: { id: { in: ids }, deletedAt: null },
    include: { role: true },
  })
  for (const target of targets) {
    await assertCanChangeSuperAdminAccess(target, 'inactive', undefined, true)
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: {
      deletedAt: new Date(),
      status: 'inactive',
      isActive: false,
    },
  })
  return result.count
}

export async function listRolesWithPermissions(): Promise<RolePermissionMatrixDto[]> {
  await ensureRolePermissionDefaults()

  const roles = await prisma.role.findMany({
    where: { name: { in: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS'] } },
    select: { id: true, name: true, description: true },
  })

  const counts = await prisma.user.groupBy({
    by: ['roleId'],
    where: { deletedAt: null },
    _count: { _all: true },
  })

  const result: RolePermissionMatrixDto[] = []
  for (const role of roles) {
    const grants = await getPermissionsForRoleCode(role.name)
    result.push({
      role: toRoleLabel(role.name),
      roleCode: toRoleCode(role.name),
      description: role.description || ROLE_DESCRIPTIONS[role.name] || '',
      userCount: counts.find((c) => c.roleId === role.id)?._count._all ?? 0,
      permissions: matrixFromGrants(grants),
    })
  }

  const order = ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']
  result.sort((a, b) => order.indexOf(a.roleCode) - order.indexOf(b.roleCode))
  return result
}

export async function updateRolePermissionMatrix(
  roleCode: string,
  permissions: Record<string, string[]>,
): Promise<RolePermissionMatrixDto> {
  const code = toRoleCode(roleCode)
  const updated = await replaceRolePermissions(code, permissions)
  const roles = await listRolesWithPermissions()
  const matrix = roles.find((r) => r.roleCode === code)
  if (!matrix) {
    return {
      role: toRoleLabel(code),
      roleCode: code,
      description: ROLE_DESCRIPTIONS[code] || '',
      userCount: 0,
      permissions: updated,
    }
  }
  return { ...matrix, permissions: updated }
}

export async function getPermissionsForAdminUser(
  id: string,
): Promise<RolePermissionMatrixDto> {
  const user = await getAdminUserById(id, true)
  const overrideCount = await prisma.userPermission.count({ where: { userId: id } })
  const grants = await getPermissionsForUserId(id)

  return {
    role: user.role,
    roleCode: user.roleCode,
    description:
      overrideCount > 0
        ? `Custom permissions for this user (role baseline: ${user.role}).`
        : ROLE_DESCRIPTIONS[user.roleCode] || '',
    userCount: 1,
    permissions: matrixFromGrants(grants),
    isCustom: overrideCount > 0,
  }
}
