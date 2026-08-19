import { Router } from 'express'
import { login, logout, me } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/rbac.middleware.js'
import { SUPER_ADMIN_ROLE } from '../types/auth.js'

const authRouter = Router()

authRouter.post('/login', login)
authRouter.get('/me', requireAuth, requireRole(SUPER_ADMIN_ROLE), me)
authRouter.post('/logout', logout)

export { authRouter }
