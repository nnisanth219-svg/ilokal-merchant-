import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error.middleware.js'
import { authRouter } from './routes/auth.routes.js'
import { auditLogRouter } from './routes/auditLog.routes.js'
import { adminUserRouter } from './routes/adminUser.routes.js'
import { categoryRouter } from './routes/category.routes.js'
import { dashboardRouter } from './routes/dashboard.routes.js'
import { memberRouter } from './routes/member.routes.js'
import { merchantRouter } from './routes/merchant.routes.js'
import { offerRouter } from './routes/offer.routes.js'
import { redemptionRouter } from './routes/redemption.routes.js'
import { reviewRouter } from './routes/review.routes.js'
import { settingsRouter } from './routes/settings.routes.js'
import { subscriptionRouter } from './routes/subscription.routes.js'

export function createApp() {
  const app = express()

  if (env.nodeEnv === 'production' || env.cookieSecure) {
    app.set('trust proxy', 1)
  }

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.frontendOrigins.includes(origin)) {
          callback(null, true)
          return
        }
        callback(null, false)
      },
      credentials: true,
    }),
  )
  app.use(express.json())
  app.use(cookieParser())

  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'iLokal API is running',
      frontend: env.frontendOrigin,
      loginPage: `${env.frontendOrigin}/login`,
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
      },
      dashboard: {
        stats: 'GET /api/dashboard/stats',
        redemptions: 'GET /api/dashboard/redemptions',
        activity: 'GET /api/dashboard/activity',
      },
      merchants: {
        list: 'GET /api/merchants',
        create: 'POST /api/merchants',
        detail: 'GET /api/merchants/:id',
        update: 'PATCH /api/merchants/:id',
        status: 'PATCH /api/merchants/:id/status',
        delete: 'DELETE /api/merchants/:id',
        restore: 'PATCH /api/merchants/:id/restore',
      },
      offers: {
        list: 'GET /api/offers',
        create: 'POST /api/offers',
        detail: 'GET /api/offers/:id',
        update: 'PATCH /api/offers/:id',
        status: 'PATCH /api/offers/:id/status',
        delete: 'DELETE /api/offers/:id',
        restore: 'PATCH /api/offers/:id/restore',
      },
      members: {
        list: 'GET /api/members',
        create: 'POST /api/members',
        detail: 'GET /api/members/:id',
        update: 'PATCH /api/members/:id',
        status: 'PATCH /api/members/:id/status',
        delete: 'DELETE /api/members/:id',
        restore: 'PATCH /api/members/:id/restore',
      },
      subscriptions: {
        list: 'GET /api/subscriptions',
        create: 'POST /api/subscriptions',
        detail: 'GET /api/subscriptions/:id',
        update: 'PATCH /api/subscriptions/:id',
        status: 'PATCH /api/subscriptions/:id/status',
        renew: 'POST /api/subscriptions/:id/renew',
      },
      redemptions: {
        list: 'GET /api/redemptions',
        create: 'POST /api/redemptions',
        detail: 'GET /api/redemptions/:id',
        update: 'PATCH /api/redemptions/:id',
        status: 'PATCH /api/redemptions/:id/status',
      },
      reviews: {
        list: 'GET /api/reviews',
        create: 'POST /api/reviews',
        detail: 'GET /api/reviews/:id',
        update: 'PATCH /api/reviews/:id',
        status: 'PATCH /api/reviews/:id/status',
        delete: 'DELETE /api/reviews/:id',
      },
      categories: {
        list: 'GET /api/categories',
        create: 'POST /api/categories',
        detail: 'GET /api/categories/:id',
        update: 'PATCH /api/categories/:id',
        status: 'PATCH /api/categories/:id/status',
        delete: 'DELETE /api/categories/:id',
        restore: 'PATCH /api/categories/:id/restore',
      },
      adminUsers: {
        list: 'GET /api/admin-users',
        roles: 'GET /api/admin-users/roles',
        invite: 'POST /api/admin-users/invite',
        detail: 'GET /api/admin-users/:id',
        permissions: 'GET /api/admin-users/:id/permissions',
        update: 'PATCH /api/admin-users/:id',
        status: 'PATCH /api/admin-users/:id/status',
        delete: 'DELETE /api/admin-users/:id',
        restore: 'PATCH /api/admin-users/:id/restore',
      },
      settings: {
        list: 'GET /api/settings',
        detail: 'GET /api/settings/:key',
        update: 'PATCH /api/settings/:key',
        updateAll: 'PATCH /api/settings',
      },
      auditLogs: {
        list: 'GET /api/audit-logs',
        detail: 'GET /api/audit-logs/:id',
      },
    })
  })

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'OK' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use('/api/merchants', merchantRouter)
  app.use('/api/offers', offerRouter)
  app.use('/api/members', memberRouter)
  app.use('/api/subscriptions', subscriptionRouter)
  app.use('/api/redemptions', redemptionRouter)
  app.use('/api/reviews', reviewRouter)
  app.use('/api/categories', categoryRouter)
  app.use('/api/admin-users', adminUserRouter)
  app.use('/api/settings', settingsRouter)
  app.use('/api/audit-logs', auditLogRouter)

  app.use(errorHandler)

  return app
}
