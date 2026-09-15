import { Router } from 'express'
import { getActivity, getRedemptions, getStats } from '../controllers/dashboard.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/rbac.middleware.js'

const dashboardRouter = Router()

dashboardRouter.use(requireAuth)

dashboardRouter.get('/stats', requirePermission('Dashboard', 'view'), getStats)
dashboardRouter.get('/redemptions', requirePermission('Dashboard', 'view'), getRedemptions)
dashboardRouter.get('/activity', requirePermission('Dashboard', 'view'), getActivity)

export { dashboardRouter }
