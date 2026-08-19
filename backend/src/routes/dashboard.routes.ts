import { Router } from 'express'
import { getActivity, getRedemptions, getStats } from '../controllers/dashboard.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/rbac.middleware.js'
import { SUPER_ADMIN_ROLE } from '../types/auth.js'

const dashboardRouter = Router()

dashboardRouter.use(requireAuth, requireRole(SUPER_ADMIN_ROLE))

dashboardRouter.get('/stats', getStats)
dashboardRouter.get('/redemptions', getRedemptions)
dashboardRouter.get('/activity', getActivity)

export { dashboardRouter }
