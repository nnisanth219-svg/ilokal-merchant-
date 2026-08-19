import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { clearAuthCookie, getAuthCookieOptions } from '../lib/jwt.js'
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
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    clearAuthCookie(res)
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    next(error)
  }
}
