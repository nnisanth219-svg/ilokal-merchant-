import type { NextFunction, Request, Response } from 'express'
import { SUPER_ADMIN_ROLE } from '../types/auth.js'
import { AppError } from '../utils/errors.js'
import { hasPermissionGrant } from '../services/rbac.service.js'

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.authUser

    if (!user) {
      next(new AppError(401, 'Unauthenticated'))
      return
    }

    if (user.role === SUPER_ADMIN_ROLE || allowedRoles.includes(user.role)) {
      next()
      return
    }

    next(new AppError(403, 'Forbidden'))
  }
}

export function requirePermission(module: string, action: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.authUser

    if (!user) {
      next(new AppError(401, 'Unauthenticated'))
      return
    }

    if (hasPermissionGrant(user.role, user.permissions ?? [], module, action)) {
      next()
      return
    }

    next(new AppError(403, 'Forbidden'))
  }
}

/** Require any one of the listed permissions. */
export function requireAnyPermission(
  checks: Array<{ module: string; action: string }>,
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.authUser

    if (!user) {
      next(new AppError(401, 'Unauthenticated'))
      return
    }

    const allowed = checks.some((check) =>
      hasPermissionGrant(user.role, user.permissions ?? [], check.module, check.action),
    )

    if (allowed) {
      next()
      return
    }

    next(new AppError(403, 'Forbidden'))
  }
}
