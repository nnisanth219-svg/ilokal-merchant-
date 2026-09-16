import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { clearAuthCookie, getAuthCookieOptions } from '../lib/jwt.js'
import { recordAuditFromRequest } from '../services/auditLog.service.js'
import {
  acceptAdminInvite,
  getInviteInfo,
  loginWithEmailPassword,
  requestPasswordReset,
  resetPasswordWithToken,
} from '../services/auth.service.js'

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password, keepSignedIn } = req.body as {
      email?: unknown
      password?: unknown
      keepSignedIn?: unknown
    }

    const result = await loginWithEmailPassword(email, password, keepSignedIn)

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

    res.cookie(env.cookieName, result.token, getAuthCookieOptions(result.keepSignedIn))
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: result.user,
      token: result.token,
      keepSignedIn: result.keepSignedIn,
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

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body as { email?: unknown }
    const result = await requestPasswordReset(email)
    res.status(200).json({
      success: true,
      data: result,
      message: result.emailConfigured
        ? 'If an account exists for that email, a reset link has been sent.'
        : 'Password reset email cannot be sent because email delivery is not configured.',
    })
  } catch (error) {
    next(error)
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token, password } = req.body as { token?: unknown; password?: unknown }
    await resetPasswordWithToken(token, password)
    res.status(200).json({
      success: true,
      message: 'Password updated. You can now sign in.',
    })
  } catch (error) {
    next(error)
  }
}

export async function inviteInfo(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token =
      typeof req.query.token === 'string'
        ? req.query.token
        : (req.body as { token?: unknown })?.token
    const data = await getInviteInfo(token)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function acceptInvite(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token, password } = req.body as { token?: unknown; password?: unknown }
    const result = await acceptAdminInvite(token, password)

    await recordAuditFromRequest(req, {
      action: 'LOGIN',
      module: 'Auth',
      actorId: result.user.id,
      actorName: result.user.name,
      actorEmail: result.user.email,
      entityId: result.user.id,
      entityLabel: result.user.name || result.user.email,
      description: 'Admin accepted invitation and set a password',
    })

    res.cookie(env.cookieName, result.token, getAuthCookieOptions(false))
    res.status(200).json({
      success: true,
      message: 'Invitation accepted',
      user: result.user,
      token: result.token,
    })
  } catch (error) {
    next(error)
  }
}
