import type { CategoryWriteInput } from '../types/category.js'
import { AppError } from '../utils/errors.js'

const STATUSES = new Set(['active', 'inactive'])

function asString(value: unknown, field: string): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new AppError(400, `${field} must be a string`)
  return value.trim()
}

function asInt(value: unknown, field: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number.parseInt(value, 10)
    if (Number.isFinite(n)) return n
  }
  throw new AppError(400, `${field} must be a number`)
}

export function parseCategoryWriteBody(body: unknown, partial = false): CategoryWriteInput {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const raw = body as Record<string, unknown>
  const input: CategoryWriteInput = {}

  const name = asString(raw.name, 'name')
  if (!partial || 'name' in raw) input.name = name

  if ('description' in raw) input.description = asString(raw.description, 'description')

  if ('status' in raw) {
    const status = asString(raw.status, 'status')
    if (!STATUSES.has(status)) throw new AppError(400, 'Invalid status')
    input.status = status as CategoryWriteInput['status']
  }

  if ('displayOrder' in raw || !partial) {
    if (raw.displayOrder !== undefined && raw.displayOrder !== null && raw.displayOrder !== '') {
      const order = asInt(raw.displayOrder, 'displayOrder')
      if (order < 1) throw new AppError(400, 'displayOrder must be at least 1')
      input.displayOrder = order
    }
  }

  if (!partial) {
    if (!input.name) throw new AppError(400, 'name is required')
  } else if ('name' in raw && !name) {
    throw new AppError(400, 'name cannot be empty')
  }

  return input
}

export function parseCategoryStatusBody(body: unknown): 'active' | 'inactive' {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const status = (body as Record<string, unknown>).status
  if (typeof status !== 'string' || !STATUSES.has(status)) {
    throw new AppError(400, 'Invalid status')
  }
  return status as 'active' | 'inactive'
}
