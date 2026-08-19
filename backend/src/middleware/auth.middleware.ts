import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { verifyAuthToken } from '../lib/jwt.js'
import { getAuthenticatedUser } from '../services/auth.service.js'
import type { AuthUser } from '../types/auth.js'
import { AppError } from '../utils/errors.js'

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[env.cookieName]

    if (typeof token !== 'string' || !token) {
      throw new AppError(401, 'Unauthenticated')
    }

    const payload = verifyAuthToken(token)
    const user = await getAuthenticatedUser(payload.sub)
    req.authUser = user
    next()
  } catch {
    next(new AppError(401, 'Unauthenticated'))
  }
}
