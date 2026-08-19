import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma.js'
import { signAuthToken } from '../lib/jwt.js'
import { SUPER_ADMIN_ROLE, type AuthUser } from '../types/auth.js'
import { AppError } from '../utils/errors.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface LoginResult {
  token: string
  user: AuthUser
}

function toAuthUser(user: {
  id: string
  email: string
  name: string
  role: { name: string }
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
  }
}

export async function loginWithEmailPassword(
  emailInput: unknown,
  passwordInput: unknown,
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

  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid email or password')
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    throw new AppError(401, 'Invalid email or password')
  }

  if (user.role.name !== SUPER_ADMIN_ROLE) {
    throw new AppError(403, 'You do not have permission to access this portal')
  }

  const token = signAuthToken({
    sub: user.id,
    role: user.role.name,
  })

  return {
    token,
    user: toAuthUser(user),
  }
}

export async function getAuthenticatedUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })

  if (!user || !user.isActive) {
    throw new AppError(401, 'Unauthenticated')
  }

  return toAuthUser(user)
}
