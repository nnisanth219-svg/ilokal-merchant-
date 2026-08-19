import type { CookieOptions, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { JwtPayload } from '../types/auth.js'

export function signAuthToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAuthToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret)

  if (typeof decoded !== 'object' || decoded === null || typeof decoded.sub !== 'string') {
    throw new Error('Invalid token payload')
  }

  const role = 'role' in decoded && typeof decoded.role === 'string' ? decoded.role : ''
  if (!role) {
    throw new Error('Invalid token role')
  }

  return {
    sub: decoded.sub,
    role,
  }
}

export function getAuthCookieOptions(): CookieOptions {
  const isProduction = env.nodeEnv === 'production'

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  }
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })
}
