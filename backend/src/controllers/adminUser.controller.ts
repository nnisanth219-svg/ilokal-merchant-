import type { NextFunction, Request, Response } from 'express'
import {
  bulkSoftDeleteAdminUsers,
  bulkUpdateAdminUserStatus,
  getAdminUserById,
  getPermissionsForAdminUser,
  inviteAdminUser,
  listAdminUsers,
  listRolesWithPermissions,
  restoreAdminUser,
  softDeleteAdminUser,
  updateAdminUser,
  updateAdminUserStatus,
  updateRolePermissionMatrix,
} from '../services/adminUser.service.js'
import { recordAuditFromRequest } from '../services/auditLog.service.js'
import type {
  AdminRoleLabel,
  AdminUserListQuery,
  AdminUserStatusValue,
} from '../types/adminUser.js'
import type { AuditActionCode } from '../types/auditLog.js'
import { AppError } from '../utils/errors.js'
import {
  parseAdminUserStatusBody,
  parseAdminUserWriteBody,
  parseInviteBody,
} from '../validation/adminUser.validation.js'

function paramId(req: Request): string {
  const id = req.params.id
  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(400, 'Admin user id is required')
  }
  return id
}

function parseListQuery(req: Request): AdminUserListQuery {
  const pageRaw = typeof req.query.page === 'string' ? Number.parseInt(req.query.page, 10) : 1
  const pageSizeRaw =
    typeof req.query.pageSize === 'string' ? Number.parseInt(req.query.pageSize, 10) : 25
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), 100)
    : 25

  return {
    page,
    pageSize,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    status:
      typeof req.query.status === 'string'
        ? (req.query.status as AdminUserStatusValue | 'all')
        : 'all',
    role:
      typeof req.query.role === 'string'
        ? (req.query.role as AdminRoleLabel | 'all')
        : 'all',
    includeDeleted:
      req.query.includeDeleted === 'true' || req.query.includeDeleted === '1',
    sortBy:
      typeof req.query.sortBy === 'string'
        ? (req.query.sortBy as AdminUserListQuery['sortBy'])
        : 'createdAt',
    sortOrder:
      req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc'
        ? req.query.sortOrder
        : 'desc',
  }
}

function parseIds(body: unknown): string[] {
  if (!body || typeof body !== 'object') return []
  const ids = (body as Record<string, unknown>).ids
  if (!Array.isArray(ids)) return []
  return ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
}

function statusAction(status: string): AuditActionCode {
  if (status === 'active') return 'ACTIVATE'
  if (status === 'inactive') return 'DEACTIVATE'
  return 'STATUS_CHANGE'
}

export async function listAdminUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listAdminUsers(parseListQuery(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function listRolesHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listRolesWithPermissions()
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateRolePermissionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const roleCode = req.params.roleCode
    if (typeof roleCode !== 'string' || !roleCode.trim()) {
      throw new AppError(400, 'Role code is required')
    }
    const permissions =
      req.body && typeof req.body === 'object' && 'permissions' in req.body
        ? (req.body as { permissions: Record<string, string[]> }).permissions
        : (req.body as Record<string, string[]>)

    if (!permissions || typeof permissions !== 'object') {
      throw new AppError(400, 'permissions payload is required')
    }

    const data = await updateRolePermissionMatrix(roleCode, permissions)
    await recordAuditFromRequest(req, {
      action: 'PERMISSION_CHANGE',
      module: 'Admin Users',
      entityId: data.roleCode,
      entityLabel: data.role,
      description: `Updated permissions for role ${data.role}`,
      newValue: JSON.stringify(data.permissions),
    })
    res.status(200).json({ success: true, data, message: 'Role permissions updated' })
  } catch (error) {
    next(error)
  }
}

export async function getAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const includeDeleted =
      req.query.includeDeleted === 'true' || req.query.includeDeleted === '1'
    const data = await getAdminUserById(paramId(req), includeDeleted)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getAdminUserPermissionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getPermissionsForAdminUser(paramId(req))
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function inviteAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseInviteBody(req.body)
    const data = await inviteAdminUser(input)
    await recordAuditFromRequest(req, {
      action: 'INVITE',
      module: 'Admin Users',
      entityId: data.id,
      entityLabel: data.fullName || data.email,
      description: `Invited admin ${data.fullName || data.email}`,
      newValue: data.role,
    })
    res.status(201).json({
      success: true,
      data,
      message: 'Invitation recorded successfully',
    })
  } catch (error) {
    next(error)
  }
}

export async function updateAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = paramId(req)
    const previous = await getAdminUserById(id)
    const previousPermissions = await getPermissionsForAdminUser(id)
    const input = parseAdminUserWriteBody(req.body, true)

    if (input.permissions) {
      const actor = req.authUser
      const canManage =
        actor &&
        (actor.role === 'SUPER_ADMIN' ||
          (actor.permissions ?? []).some(
            (p) => p.module === 'Admin Users' && p.action === 'manage',
          ))
      if (!canManage) {
        throw new AppError(403, 'Forbidden')
      }
    }

    const data = await updateAdminUser(id, input)
    const roleChanged = Boolean(input.role) && previous.role !== data.role
    const permissionsChanged = Boolean(input.permissions)

    if (permissionsChanged) {
      const nextPermissions = await getPermissionsForAdminUser(id)
      await recordAuditFromRequest(req, {
        action: 'PERMISSION_CHANGE',
        module: 'Admin Users',
        entityId: data.id,
        entityLabel: data.fullName || data.email,
        description: `Updated permissions for ${data.fullName || data.email}`,
        previousValue: JSON.stringify(previousPermissions.permissions),
        newValue: JSON.stringify(nextPermissions.permissions),
      })
    }

    if (roleChanged) {
      await recordAuditFromRequest(req, {
        action: 'ROLE_CHANGE',
        module: 'Admin Users',
        entityId: data.id,
        entityLabel: data.fullName || data.email,
        description: `Changed role for ${data.fullName || data.email} to ${data.role}`,
        previousValue: previous.role,
        newValue: data.role,
      })
    } else if (!permissionsChanged) {
      await recordAuditFromRequest(req, {
        action: 'UPDATE',
        module: 'Admin Users',
        entityId: data.id,
        entityLabel: data.fullName || data.email,
        description: `Updated admin ${data.fullName || data.email}`,
      })
    }

    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateAdminUserStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = parseAdminUserStatusBody(req.body)
    const data = await updateAdminUserStatus(paramId(req), status)
    await recordAuditFromRequest(req, {
      action: statusAction(status),
      module: 'Admin Users',
      entityId: data.id,
      entityLabel: data.fullName || data.email,
      description: `Changed admin status to ${status}`,
      newValue: status,
    })
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function deleteAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await softDeleteAdminUser(paramId(req))
    await recordAuditFromRequest(req, {
      action: 'DELETE',
      module: 'Admin Users',
      entityId: data.id,
      entityLabel: data.fullName || data.email,
      description: `Deleted admin ${data.fullName || data.email}`,
    })
    res.status(200).json({ success: true, data, message: 'Admin user deleted' })
  } catch (error) {
    next(error)
  }
}

export async function restoreAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await restoreAdminUser(paramId(req))
    await recordAuditFromRequest(req, {
      action: 'RESTORE',
      module: 'Admin Users',
      entityId: data.id,
      entityLabel: data.fullName || data.email,
      description: `Restored admin ${data.fullName || data.email}`,
    })
    res.status(200).json({ success: true, data, message: 'Admin user restored' })
  } catch (error) {
    next(error)
  }
}

export async function bulkStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ids = parseIds(req.body)
    const status = parseAdminUserStatusBody(req.body)
    const count = await bulkUpdateAdminUserStatus(ids, status)
    await recordAuditFromRequest(req, {
      action: 'BULK_UPDATE',
      module: 'Admin Users',
      description: `Bulk updated status to ${status} for ${count} admin user(s)`,
      newValue: status,
      metadata: { ids, count },
    })
    res.status(200).json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
}

export async function bulkDeleteHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ids = parseIds(req.body)
    const count = await bulkSoftDeleteAdminUsers(ids)
    await recordAuditFromRequest(req, {
      action: 'BULK_DELETE',
      module: 'Admin Users',
      description: `Bulk deleted ${count} admin user(s)`,
      metadata: { ids, count },
    })
    res.status(200).json({ success: true, data: { count } })
  } catch (error) {
    next(error)
  }
}
