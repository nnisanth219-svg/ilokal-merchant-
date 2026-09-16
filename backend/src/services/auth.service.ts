import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import {
  signAuthToken,
  signPurposeToken,
  verifyPurposeToken,
} from '../lib/jwt.js'
import { isEmailConfigured, sendMail } from '../lib/mailer.js'
import {
  PORTAL_ROLES,
  roleLabelFromCode,
  type AuthUser,
} from '../types/auth.js'
import { AppError } from '../utils/errors.js'
import {
  ensureRolePermissionDefaults,
  getPermissionsForUserId,
} from './rbac.service.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export interface LoginResult {
  token: string
  user: AuthUser
  keepSignedIn: boolean
}

export interface ForgotPasswordResult {
  emailConfigured: boolean
}

export interface InviteInfoResult {
  email: string
  name: string
}

async function toAuthUser(user: {
  id: string
  email: string
  name: string
  roleId: string
  role: { name: string }
}): Promise<AuthUser> {
  await ensureRolePermissionDefaults()
  const permissions = await getPermissionsForUserId(user.id)
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    roleLabel: roleLabelFromCode(user.role.name),
    permissions,
  }
}

function assertPassword(password: string): void {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
}

export async function loginWithEmailPassword(
  emailInput: unknown,
  passwordInput: unknown,
  keepSignedInInput: unknown = false,
): Promise<LoginResult> {
  if (typeof emailInput !== 'string' || typeof passwordInput !== 'string') {
    throw new AppError(400, 'Email and password are required')
  }

  const email = emailInput.trim().toLowerCase()
  const password = passwordInput

  if (!email || !password) {
    throw new AppError(400, 'Email and password are required')
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError(400, 'Enter a valid email address')
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })

  if (!user || user.deletedAt || !user.isActive || user.status !== 'active') {
    throw new AppError(401, 'Invalid email or password')
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    throw new AppError(401, 'Invalid email or password')
  }

  if (!(PORTAL_ROLES as readonly string[]).includes(user.role.name)) {
    throw new AppError(403, 'You do not have permission to access this portal')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const keepSignedIn = keepSignedInInput === true || keepSignedInInput === 'true'
  const token = signAuthToken(
    {
      sub: user.id,
      role: user.role.name,
    },
    keepSignedIn ? env.jwtRememberExpiresIn : env.jwtSessionExpiresIn,
  )

  return {
    token,
    user: await toAuthUser(user),
    keepSignedIn,
  }
}

export async function getAuthenticatedUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })

  if (!user || user.deletedAt || !user.isActive || user.status !== 'active') {
    throw new AppError(401, 'Unauthenticated')
  }

  if (!(PORTAL_ROLES as readonly string[]).includes(user.role.name)) {
    throw new AppError(403, 'Forbidden')
  }

  return toAuthUser(user)
}

export async function requestPasswordReset(emailInput: unknown): Promise<ForgotPasswordResult> {
  if (typeof emailInput !== 'string' || !emailInput.trim()) {
    throw new AppError(400, 'Email is required')
  }
  const email = emailInput.trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError(400, 'Enter a valid email address')
  }

  const emailConfigured = isEmailConfigured()
  if (!emailConfigured) {
    return { emailConfigured }
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })

  if (
    user &&
    !user.deletedAt &&
    user.isActive &&
    user.status === 'active' &&
    (PORTAL_ROLES as readonly string[]).includes(user.role.name)
  ) {
    const token = signPurposeToken(
      { sub: user.id, purpose: 'password_reset', email: user.email },
      env.passwordResetExpiresIn,
    )
    const resetUrl = `${env.frontendOrigin}/login/reset?token=${encodeURIComponent(token)}`
    await sendMail({
      to: user.email,
      subject: 'Reset your iLokal admin password',
      text: `Reset your iLokal admin password using this link (expires soon):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    })
  }

  return { emailConfigured: true }
}

export async function resetPasswordWithToken(
  tokenInput: unknown,
  passwordInput: unknown,
): Promise<void> {
  if (typeof tokenInput !== 'string' || !tokenInput.trim()) {
    throw new AppError(400, 'Reset token is required')
  }
  if (typeof passwordInput !== 'string') {
    throw new AppError(400, 'Password is required')
  }
  assertPassword(passwordInput)

  let payload
  try {
    payload = verifyPurposeToken(tokenInput.trim(), 'password_reset')
  } catch {
    throw new AppError(400, 'This reset link is invalid or has expired')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user || user.deletedAt || user.status !== 'active') {
    throw new AppError(400, 'This reset link is invalid or has expired')
  }

  const passwordHash = await bcrypt.hash(passwordInput, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })
}

export function createAdminInviteToken(userId: string, email: string): string {
  return signPurposeToken(
    { sub: userId, purpose: 'admin_invite', email },
    env.inviteTokenExpiresIn,
  )
}

export function inviteUrlForToken(token: string): string {
  return `${env.frontendOrigin}/login/accept-invite?token=${encodeURIComponent(token)}`
}

export async function getInviteInfo(tokenInput: unknown): Promise<InviteInfoResult> {
  if (typeof tokenInput !== 'string' || !tokenInput.trim()) {
    throw new AppError(400, 'Invite token is required')
  }
  let payload
  try {
    payload = verifyPurposeToken(tokenInput.trim(), 'admin_invite')
  } catch {
    throw new AppError(400, 'This invitation link is invalid or has expired')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user || user.deletedAt || user.status !== 'pending') {
    throw new AppError(400, 'This invitation is no longer valid')
  }

  return { email: user.email, name: user.name }
}

export async function acceptAdminInvite(
  tokenInput: unknown,
  passwordInput: unknown,
): Promise<LoginResult> {
  if (typeof tokenInput !== 'string' || !tokenInput.trim()) {
    throw new AppError(400, 'Invite token is required')
  }
  if (typeof passwordInput !== 'string') {
    throw new AppError(400, 'Password is required')
  }
  assertPassword(passwordInput)

  let payload
  try {
    payload = verifyPurposeToken(tokenInput.trim(), 'admin_invite')
  } catch {
    throw new AppError(400, 'This invitation link is invalid or has expired')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: true },
  })
  if (!user || user.deletedAt || user.status !== 'pending') {
    throw new AppError(400, 'This invitation is no longer valid')
  }

  const passwordHash = await bcrypt.hash(passwordInput, 12)
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      status: 'active',
      isActive: true,
      lastLoginAt: new Date(),
    },
    include: { role: true },
  })

  const token = signAuthToken(
    { sub: updated.id, role: updated.role.name },
    env.jwtSessionExpiresIn,
  )

  return {
    token,
    user: await toAuthUser(updated),
    keepSignedIn: false,
  }
}
