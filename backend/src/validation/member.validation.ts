import type { MemberWriteInput, MembershipPlanValue } from '../types/member.js'
import { AppError } from '../utils/errors.js'

const MEMBER_STATUSES = new Set(['active', 'expired', 'suspended', 'inactive'])
const MEMBER_PLANS = new Set(['Annual', 'Monthly', 'None'])

function asString(value: unknown, field: string): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new AppError(400, `${field} must be a string`)
  return value.trim()
}

function parseIsoDate(value: string, field: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throw new AppError(400, `${field} is invalid`)
  return d.toISOString()
}

export function parseMemberWriteBody(body: unknown, partial = false): MemberWriteInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const raw = body as Record<string, unknown>
  const input: MemberWriteInput = {}

  const fullName = asString(raw.fullName, 'fullName')
  const email = asString(raw.email, 'email')

  if (!partial || 'fullName' in raw) input.fullName = fullName
  if (!partial || 'email' in raw) input.email = email

  if (!partial) {
    if (!input.fullName) throw new AppError(400, 'fullName is required')
    if (!input.email) throw new AppError(400, 'email is required')
  } else {
    if ('fullName' in raw && !fullName) throw new AppError(400, 'fullName cannot be empty')
    if ('email' in raw && !email) throw new AppError(400, 'email cannot be empty')
  }

  if ('phone' in raw) input.phone = asString(raw.phone, 'phone')
  if ('city' in raw) input.city = asString(raw.city, 'city')
  if ('deviceName' in raw) input.deviceName = asString(raw.deviceName, 'deviceName')
  if ('appVersion' in raw) input.appVersion = asString(raw.appVersion, 'appVersion')
  if ('platform' in raw) input.platform = asString(raw.platform, 'platform')
  if ('paymentStatus' in raw) input.paymentStatus = asString(raw.paymentStatus, 'paymentStatus')

  if ('status' in raw) {
    const status = asString(raw.status, 'status')
    if (!MEMBER_STATUSES.has(status)) throw new AppError(400, 'Invalid status')
    input.status = status as MemberWriteInput['status']
  }

  if ('plan' in raw) {
    const plan = asString(raw.plan, 'plan')
    if (!MEMBER_PLANS.has(plan)) throw new AppError(400, 'Invalid plan')
    input.plan = plan as MembershipPlanValue
  }

  if ('joinedAt' in raw) {
    const joinedAt = asString(raw.joinedAt, 'joinedAt')
    if (!joinedAt) throw new AppError(400, 'joinedAt cannot be empty')
    input.joinedAt = parseIsoDate(joinedAt, 'joinedAt')
  }

  if ('expiresAt' in raw) {
    if (raw.expiresAt === null || raw.expiresAt === '') {
      input.expiresAt = null
    } else {
      input.expiresAt = parseIsoDate(asString(raw.expiresAt, 'expiresAt'), 'expiresAt')
    }
  }

  if ('lastActiveAt' in raw) {
    if (raw.lastActiveAt === null || raw.lastActiveAt === '') {
      input.lastActiveAt = null
    } else {
      input.lastActiveAt = parseIsoDate(asString(raw.lastActiveAt, 'lastActiveAt'), 'lastActiveAt')
    }
  }

  if (Array.isArray(raw.purchases)) input.purchases = raw.purchases as MemberWriteInput['purchases']
  if (Array.isArray(raw.redemptions)) {
    input.redemptions = raw.redemptions as MemberWriteInput['redemptions']
  }
  if (Array.isArray(raw.reviews)) input.reviews = raw.reviews as MemberWriteInput['reviews']
  if (Array.isArray(raw.supportNotes)) {
    input.supportNotes = raw.supportNotes as MemberWriteInput['supportNotes']
  }

  return input
}

export function parseMemberStatusBody(
  body: unknown,
): 'active' | 'expired' | 'suspended' | 'inactive' {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const status = (body as Record<string, unknown>).status
  if (typeof status !== 'string' || !MEMBER_STATUSES.has(status)) {
    throw new AppError(400, 'Invalid status')
  }
  return status as 'active' | 'expired' | 'suspended' | 'inactive'
}
