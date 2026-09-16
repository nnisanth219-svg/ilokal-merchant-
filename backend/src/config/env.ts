import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/** Deployed Vercel SPA — always allowed so Railway CORS works even if FRONTEND_ORIGIN is still localhost. */
const PRODUCTION_FRONTEND_ORIGINS = ['https://ilokal-merchant.vercel.app']

function parseOrigins(raw: string | undefined): string[] {
  const list = (raw ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim().replace(/\/+$/, ''))
    .filter(Boolean)

  for (const origin of PRODUCTION_FRONTEND_ORIGINS) {
    if (!list.includes(origin)) list.push(origin)
  }

  return list.length > 0 ? list : ['http://localhost:3000']
}

function parseSameSite(
  raw: string | undefined,
  fallback: 'lax' | 'strict' | 'none',
): 'lax' | 'strict' | 'none' {
  const value = (raw ?? fallback).trim().toLowerCase()
  if (value === 'strict' || value === 'none' || value === 'lax') return value
  return fallback
}

const nodeEnv = process.env.NODE_ENV ?? 'development'
const frontendOrigins = parseOrigins(process.env.FRONTEND_ORIGIN)
// Vercel and Railway are different sites; Lax cookies are not stored on the login response.
const cookieSameSite =
  nodeEnv === 'production' ? 'none' : parseSameSite(process.env.COOKIE_SAMESITE, 'lax')
const cookieSecure =
  process.env.COOKIE_SECURE === 'true' ||
  (process.env.COOKIE_SECURE !== 'false' && (nodeEnv === 'production' || cookieSameSite === 'none'))

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN ?? '30d',
  jwtSessionExpiresIn: process.env.JWT_SESSION_EXPIRES_IN ?? '12h',
  inviteTokenExpiresIn: process.env.INVITE_TOKEN_EXPIRES_IN ?? '7d',
  passwordResetExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN ?? '1h',
  smtpHost: (process.env.SMTP_HOST ?? '').trim(),
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: (process.env.SMTP_USER ?? '').trim(),
  smtpPass: process.env.SMTP_PASS ?? '',
  smtpFrom: (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '').trim(),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  frontendOrigins,
  frontendOrigin:
    nodeEnv === 'production'
      ? (frontendOrigins.find(
          (origin) => origin.startsWith('https://') && !origin.includes('localhost'),
        ) ?? frontendOrigins[0])
      : frontendOrigins[0],
  cookieName: process.env.COOKIE_NAME ?? 'ilokal_token',
  cookieSameSite,
  cookieSecure,
  seedSuperAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@ilokal.my',
  seedSuperAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'SuperAdmin123!',
  seedSuperAdminName: process.env.SEED_SUPER_ADMIN_NAME ?? 'David R.',
} as const
