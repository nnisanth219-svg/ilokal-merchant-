import type {
  SubscriptionPlanValue,
  SubscriptionWriteInput,
} from '../types/subscription.js'
import { AppError } from '../utils/errors.js'

const STATUSES = new Set(['active', 'expired', 'suspended', 'cancelled'])
const PLANS = new Set(['Monthly', 'Annual'])

function asString(value: unknown, field: string): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new AppError(400, `${field} must be a string`)
  return value.trim()
}

function parseDateOnly(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(400, `${field} must be YYYY-MM-DD`)
  }
  const d = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) throw new AppError(400, `${field} is invalid`)
  return value
}

function asOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number.parseFloat(value)
    if (!Number.isFinite(n)) throw new AppError(400, `${field} must be a number`)
    return n
  }
  throw new AppError(400, `${field} must be a number`)
}

export function parseSubscriptionWriteBody(
  body: unknown,
  partial = false,
): SubscriptionWriteInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const raw = body as Record<string, unknown>
  const input: SubscriptionWriteInput = {}

  const memberId = asString(raw.memberId, 'memberId')
  if (!partial || 'memberId' in raw) input.memberId = memberId

  if ('plan' in raw || !partial) {
    const plan = asString(raw.plan, 'plan')
    if (plan && !PLANS.has(plan)) throw new AppError(400, 'Invalid plan')
    if (plan) input.plan = plan as SubscriptionPlanValue
  }

  if ('billing' in raw || !partial) {
    const billing = asString(raw.billing, 'billing')
    if (billing && !PLANS.has(billing)) throw new AppError(400, 'Invalid billing')
    if (billing) input.billing = billing as SubscriptionPlanValue
  }

  if ('startDate' in raw || !partial) {
    const startDate = asString(raw.startDate, 'startDate')
    if (startDate) input.startDate = parseDateOnly(startDate, 'startDate')
  }

  if ('expiryDate' in raw || !partial) {
    const expiryDate = asString(raw.expiryDate, 'expiryDate')
    if (expiryDate) input.expiryDate = parseDateOnly(expiryDate, 'expiryDate')
  }

  if ('status' in raw) {
    const status = asString(raw.status, 'status')
    if (!STATUSES.has(status)) throw new AppError(400, 'Invalid status')
    input.status = status as SubscriptionWriteInput['status']
  }

  if ('amount' in raw) {
    const amount = asOptionalNumber(raw.amount, 'amount')
    if (amount !== undefined) input.amount = amount
  }

  if ('currency' in raw) input.currency = asString(raw.currency, 'currency') || 'MYR'

  if (Array.isArray(raw.payments)) {
    input.payments = raw.payments as SubscriptionWriteInput['payments']
  }

  if (!partial) {
    if (!input.memberId) throw new AppError(400, 'memberId is required')
    if (!input.plan) throw new AppError(400, 'plan is required')
    if (!input.startDate) throw new AppError(400, 'startDate is required')
    if (!input.expiryDate) throw new AppError(400, 'expiryDate is required')
  } else {
    if ('memberId' in raw && !memberId) throw new AppError(400, 'memberId cannot be empty')
  }

  if (input.startDate && input.expiryDate && input.startDate > input.expiryDate) {
    throw new AppError(400, 'start date must not be after expiry date')
  }

  if (!input.billing && input.plan) input.billing = input.plan

  return input
}

export function parseSubscriptionStatusBody(
  body: unknown,
): 'active' | 'expired' | 'suspended' | 'cancelled' {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const status = (body as Record<string, unknown>).status
  if (typeof status !== 'string' || !STATUSES.has(status)) {
    throw new AppError(400, 'Invalid status')
  }
  return status as 'active' | 'expired' | 'suspended' | 'cancelled'
}
