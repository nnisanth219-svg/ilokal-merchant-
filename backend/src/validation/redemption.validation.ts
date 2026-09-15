import type { RedemptionWriteInput } from '../types/redemption.js'
import { AppError } from '../utils/errors.js'

const STATUSES = new Set(['successful', 'failed', 'cancelled'])

function asString(value: unknown, field: string): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new AppError(400, `${field} must be a string`)
  return value.trim()
}

export function parseRedemptionWriteBody(
  body: unknown,
  partial = false,
): RedemptionWriteInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const raw = body as Record<string, unknown>
  const input: RedemptionWriteInput = {}

  const memberId = asString(raw.memberId, 'memberId')
  const merchantId = asString(raw.merchantId, 'merchantId')
  const offerId = asString(raw.offerId, 'offerId')

  if (!partial || 'memberId' in raw) input.memberId = memberId
  if (!partial || 'merchantId' in raw) input.merchantId = merchantId
  if (!partial || 'offerId' in raw) input.offerId = offerId

  if ('redeemedAt' in raw || !partial) {
    const redeemedAt = asString(raw.redeemedAt, 'redeemedAt')
    if (redeemedAt) {
      const d = new Date(redeemedAt)
      if (Number.isNaN(d.getTime())) throw new AppError(400, 'redeemedAt is invalid')
      input.redeemedAt = d.toISOString()
    }
  }

  if ('status' in raw) {
    const status = asString(raw.status, 'status')
    if (!STATUSES.has(status)) throw new AppError(400, 'Invalid status')
    input.status = status as RedemptionWriteInput['status']
  }

  if ('method' in raw) input.method = asString(raw.method, 'method')
  if ('verificationStatus' in raw) {
    input.verificationStatus = asString(raw.verificationStatus, 'verificationStatus')
  }
  if (Array.isArray(raw.activity)) {
    input.activity = raw.activity as RedemptionWriteInput['activity']
  }

  if (!partial) {
    if (!input.memberId) throw new AppError(400, 'memberId is required')
    if (!input.merchantId) throw new AppError(400, 'merchantId is required')
    if (!input.offerId) throw new AppError(400, 'offerId is required')
  }

  return input
}

export function parseRedemptionStatusBody(
  body: unknown,
): 'successful' | 'failed' | 'cancelled' {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const status = (body as Record<string, unknown>).status
  if (typeof status !== 'string' || !STATUSES.has(status)) {
    throw new AppError(400, 'Invalid status')
  }
  return status as 'successful' | 'failed' | 'cancelled'
}
