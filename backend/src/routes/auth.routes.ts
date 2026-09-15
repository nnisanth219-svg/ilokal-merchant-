import { Router } from 'express'
import { login, logout, me } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const authRouter = Router()

authRouter.post('/login', login)
authRouter.get('/me', requireAuth, me)
authRouter.post('/logout', logout)

export { authRouter }
