import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { clearAuthCookie, getAuthCookieOptions } from '../lib/jwt.js'
import { recordAuditFromRequest } from '../services/auditLog.service.js'
import { loginWithEmailPassword } from '../services/auth.service.js'

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body as {
      email?: unknown
      password?: unknown
    }

    const result = await loginWithEmailPassword(email, password)

    await recordAuditFromRequest(req, {
      action: 'LOGIN',
      module: 'Auth',
      actorId: result.user.id,
      actorName: result.user.name,
      actorEmail: result.user.email,
      entityId: result.user.id,
      entityLabel: result.user.name || result.user.email,
      description: 'Admin logged in',
    })

    res.cookie(env.cookieName, result.token, getAuthCookieOptions())
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: result.user,
    })
  } catch (error) {
    next(error)
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      user: req.authUser,
    })
  } catch (error) {
    next(error)
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await recordAuditFromRequest(req, {
      action: 'LOGOUT',
      module: 'Auth',
      entityId: req.authUser?.id,
      entityLabel: req.authUser?.name || req.authUser?.email,
      description: 'Admin logged out',
    })
    clearAuthCookie(res)
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    next(error)
  }
}
