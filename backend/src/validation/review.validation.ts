import type { ReviewWriteInput } from '../types/review.js'
import { AppError } from '../utils/errors.js'

const STATUSES = new Set(['published', 'pending', 'flagged', 'hidden'])

function asString(value: unknown, field: string): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new AppError(400, `${field} must be a string`)
  return value.trim()
}

function asRating(value: unknown): number {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : NaN
  if (!Number.isFinite(n) || n < 1 || n > 5) {
    throw new AppError(400, 'rating must be an integer from 1 to 5')
  }
  return Math.trunc(n)
}

export function parseReviewWriteBody(body: unknown, partial = false): ReviewWriteInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const raw = body as Record<string, unknown>
  const input: ReviewWriteInput = {}

  const memberId = asString(raw.memberId, 'memberId')
  const merchantId = asString(raw.merchantId, 'merchantId')

  if (!partial || 'memberId' in raw) input.memberId = memberId
  if (!partial || 'merchantId' in raw) input.merchantId = merchantId

  if ('rating' in raw || !partial) {
    if (raw.rating !== undefined && raw.rating !== null && raw.rating !== '') {
      input.rating = asRating(raw.rating)
    }
  }

  if ('text' in raw) input.text = asString(raw.text, 'text')

  if ('submittedAt' in raw || !partial) {
    const submittedAt = asString(raw.submittedAt, 'submittedAt')
    if (submittedAt) {
      const d = new Date(submittedAt)
      if (Number.isNaN(d.getTime())) throw new AppError(400, 'submittedAt is invalid')
      input.submittedAt = d.toISOString()
    }
  }

  if ('status' in raw) {
    const status = asString(raw.status, 'status')
    if (!STATUSES.has(status)) throw new AppError(400, 'Invalid status')
    input.status = status as ReviewWriteInput['status']
  }

  if (!partial) {
    if (!input.memberId) throw new AppError(400, 'memberId is required')
    if (!input.merchantId) throw new AppError(400, 'merchantId is required')
    if (input.rating === undefined) throw new AppError(400, 'rating is required')
  }

  return input
}

export function parseReviewStatusBody(
  body: unknown,
): 'published' | 'pending' | 'flagged' | 'hidden' {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const status = (body as Record<string, unknown>).status
  if (typeof status !== 'string' || !STATUSES.has(status)) {
    throw new AppError(400, 'Invalid status')
  }
  return status as 'published' | 'pending' | 'flagged' | 'hidden'
}
