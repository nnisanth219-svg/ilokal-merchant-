import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function parseOrigins(raw: string | undefined): string[] {
  const list = (raw ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return list.length > 0 ? list : ['http://localhost:3000']
}

function parseSameSite(raw: string | undefined): 'lax' | 'strict' | 'none' {
  const value = (raw ?? 'lax').trim().toLowerCase()
  if (value === 'strict' || value === 'none' || value === 'lax') return value
  return 'lax'
}

const nodeEnv = process.env.NODE_ENV ?? 'development'
const frontendOrigins = parseOrigins(process.env.FRONTEND_ORIGIN)
const cookieSameSite = parseSameSite(process.env.COOKIE_SAMESITE)
const cookieSecure =
  process.env.COOKIE_SECURE === 'true' ||
  (process.env.COOKIE_SECURE !== 'false' && (nodeEnv === 'production' || cookieSameSite === 'none'))

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  frontendOrigins,
  frontendOrigin: frontendOrigins[0],
  cookieName: process.env.COOKIE_NAME ?? 'ilokal_token',
  cookieSameSite,
  cookieSecure,
  seedSuperAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@ilokal.my',
  seedSuperAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'SuperAdmin123!',
  seedSuperAdminName: process.env.SEED_SUPER_ADMIN_NAME ?? 'David R.',
} as const
