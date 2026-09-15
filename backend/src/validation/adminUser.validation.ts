import type { AdminRoleCode, AdminRoleLabel, AdminUserWriteInput } from '../types/adminUser.js'
import { AppError } from '../utils/errors.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ROLE_CODE_BY_LABEL: Record<AdminRoleLabel, AdminRoleCode> = {
  'Super Admin': 'SUPER_ADMIN',
  Admin: 'ADMIN',
  Operations: 'OPERATIONS',
}

const ROLE_LABEL_BY_CODE: Record<AdminRoleCode, AdminRoleLabel> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  OPERATIONS: 'Operations',
}

export function toRoleCode(role: string): AdminRoleCode {
  const trimmed = role.trim()
  if (trimmed === 'SUPER_ADMIN' || trimmed === 'ADMIN' || trimmed === 'OPERATIONS') {
    return trimmed
  }
  if (trimmed in ROLE_CODE_BY_LABEL) {
    return ROLE_CODE_BY_LABEL[trimmed as AdminRoleLabel]
  }
  throw new AppError(400, 'Invalid role')
}

export function toRoleLabel(role: string): AdminRoleLabel {
  const code = toRoleCode(role)
  return ROLE_LABEL_BY_CODE[code]
}

export function isActiveFromStatus(status: 'active' | 'pending' | 'inactive'): boolean {
  return status === 'active'
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new AppError(400, `${field} is required`)
  return value.trim()
}

export function parseInviteBody(body: unknown): {
  fullName: string
  email: string
  role: AdminRoleCode
} {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const raw = body as Record<string, unknown>
  const fullName = asString(raw.fullName ?? raw.name, 'fullName')
  const email = asString(raw.email, 'email').toLowerCase()
  if (!fullName) throw new AppError(400, 'fullName is required')
  if (!email) throw new AppError(400, 'email is required')
  if (!EMAIL_PATTERN.test(email)) throw new AppError(400, 'Enter a valid email address')
  const roleRaw = asString(raw.role, 'role')
  if (!roleRaw) throw new AppError(400, 'role is required')
  return { fullName, email, role: toRoleCode(roleRaw) }
}

export function parseAdminUserWriteBody(body: unknown, partial: boolean): AdminUserWriteInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const raw = body as Record<string, unknown>
  const input: AdminUserWriteInput = {}

  if (!partial || 'fullName' in raw || 'name' in raw) {
    const fullName = asString(raw.fullName ?? raw.name, 'fullName')
    if (!fullName) throw new AppError(400, 'fullName is required')
    input.fullName = fullName
  }

  if (!partial || 'email' in raw) {
    const email = asString(raw.email, 'email').toLowerCase()
    if (!email) throw new AppError(400, 'email is required')
    if (!EMAIL_PATTERN.test(email)) throw new AppError(400, 'Enter a valid email address')
    input.email = email
  }

  if (!partial || 'role' in raw) {
    const role = asString(raw.role, 'role')
    if (!role) throw new AppError(400, 'role is required')
    input.role = toRoleCode(role)
  }

  if (!partial || 'status' in raw) {
    const status = asString(raw.status, 'status')
    if (status !== 'active' && status !== 'pending' && status !== 'inactive') {
      throw new AppError(400, 'Invalid status')
    }
    input.status = status
  }

  if ('permissions' in raw) {
    const permissions = raw.permissions
    if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
      throw new AppError(400, 'permissions must be an object of module → actions[]')
    }
    input.permissions = permissions as AdminUserWriteInput['permissions']
  }

  return input
}

export function parseAdminUserStatusBody(body: unknown): 'active' | 'pending' | 'inactive' {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const status = (body as Record<string, unknown>).status
  if (status !== 'active' && status !== 'pending' && status !== 'inactive') {
    throw new AppError(400, 'Invalid status')
  }
  return status
}
