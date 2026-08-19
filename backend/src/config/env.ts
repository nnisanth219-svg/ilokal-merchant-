import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  cookieName: process.env.COOKIE_NAME ?? 'ilokal_token',
  seedSuperAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@ilokal.my',
  seedSuperAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'SuperAdmin123!',
  seedSuperAdminName: process.env.SEED_SUPER_ADMIN_NAME ?? 'David R.',
} as const
