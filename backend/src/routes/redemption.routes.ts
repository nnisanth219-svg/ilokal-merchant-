import { Router } from 'express'
import {
  createRedemptionHandler,
  getRedemptionHandler,
  listRedemptionsHandler,
  updateRedemptionHandler,
  updateRedemptionStatusHandler,
} from '../controllers/redemption.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAnyPermission, requirePermission } from '../middleware/rbac.middleware.js'

const redemptionRouter = Router()

redemptionRouter.use(requireAuth)

redemptionRouter.get('/', requirePermission('Redemptions', 'view'), listRedemptionsHandler)
redemptionRouter.post('/', requirePermission('Redemptions', 'create'), createRedemptionHandler)
redemptionRouter.get('/:id', requirePermission('Redemptions', 'view'), getRedemptionHandler)
redemptionRouter.patch('/:id', requirePermission('Redemptions', 'edit'), updateRedemptionHandler)
redemptionRouter.put('/:id', requirePermission('Redemptions', 'edit'), updateRedemptionHandler)
redemptionRouter.patch(
  '/:id/status',
  requireAnyPermission([
    { module: 'Redemptions', action: 'manage' },
    { module: 'Redemptions', action: 'edit' },
  ]),
  updateRedemptionStatusHandler,
)

export { redemptionRouter }
