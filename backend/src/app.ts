import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error.middleware.js'
import { authRouter } from './routes/auth.routes.js'
import { dashboardRouter } from './routes/dashboard.routes.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: env.frontendOrigin,
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
    })
  })

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'OK' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/dashboard', dashboardRouter)

  app.use(errorHandler)

  return app
}
