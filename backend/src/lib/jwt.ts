import type { CookieOptions, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { JwtPayload } from '../types/auth.js'

export type PurposeTokenKind = 'password_reset' | 'admin_invite'

export interface PurposeTokenPayload {
  sub: string
  purpose: PurposeTokenKind
  email?: string
}

export function signAuthToken(payload: JwtPayload, expiresIn?: string): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: (expiresIn ?? env.jwtExpiresIn) as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAuthToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret)

  if (typeof decoded !== 'object' || decoded === null || typeof decoded.sub !== 'string') {
    throw new Error('Invalid token payload')
  }

  if ('purpose' in decoded && typeof decoded.purpose === 'string' && decoded.purpose) {
    throw new Error('Invalid token purpose')
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

export function signPurposeToken(
  payload: PurposeTokenPayload,
  expiresIn: string,
): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyPurposeToken(
  token: string,
  purpose: PurposeTokenKind,
): PurposeTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret)
  if (typeof decoded !== 'object' || decoded === null || typeof decoded.sub !== 'string') {
    throw new Error('Invalid token payload')
  }
  const tokenPurpose =
    'purpose' in decoded && typeof decoded.purpose === 'string' ? decoded.purpose : ''
  if (tokenPurpose !== purpose) {
    throw new Error('Invalid token purpose')
  }
  const email =
    'email' in decoded && typeof decoded.email === 'string' ? decoded.email : undefined
  return {
    sub: decoded.sub,
    purpose,
    email,
  }
}

export function getAuthCookieOptions(keepSignedIn = false): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
  }
  if (keepSignedIn) {
    options.maxAge = 30 * 24 * 60 * 60 * 1000
  }
  return options
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
    expires: new Date(0),
  })
}
