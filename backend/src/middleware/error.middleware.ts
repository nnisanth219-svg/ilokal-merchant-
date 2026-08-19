import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/errors.js'

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
    return
  }

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
  ) {
    const status = error.status
    const message =
      'type' in error && error.type === 'entity.parse.failed'
        ? 'Invalid JSON body'
        : 'Bad request'

    res.status(status).json({
      success: false,
      message,
    })
    return
  }

  console.error('[api]', error)
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  })
}
