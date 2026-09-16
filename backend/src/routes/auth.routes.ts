import { Router } from 'express'
import {
  acceptInvite,
  forgotPassword,
  inviteInfo,
  login,
  logout,
  me,
  resetPassword,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const authRouter = Router()

authRouter.post('/login', login)
authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)
authRouter.get('/invite-info', inviteInfo)
authRouter.post('/accept-invite', acceptInvite)
authRouter.get('/me', requireAuth, me)
authRouter.post('/logout', logout)

export { authRouter }
