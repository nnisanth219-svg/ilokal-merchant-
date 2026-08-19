import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/errors.js'

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.authUser

    if (!user) {
      next(new AppError(401, 'Unauthenticated'))
      return
    }

    if (!allowedRoles.includes(user.role)) {
      next(new AppError(403, 'Forbidden'))
      return
    }

    next()
  }
}
