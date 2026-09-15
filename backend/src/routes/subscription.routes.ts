import { Router } from 'express'
import {
  bulkStatusHandler,
  createSubscriptionHandler,
  getSubscriptionHandler,
  listSubscriptionsHandler,
  renewSubscriptionHandler,
  updateSubscriptionHandler,
  updateSubscriptionStatusHandler,
} from '../controllers/subscription.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAnyPermission, requirePermission } from '../middleware/rbac.middleware.js'

const subscriptionRouter = Router()

subscriptionRouter.use(requireAuth)

subscriptionRouter.get('/', requirePermission('Subscriptions', 'view'), listSubscriptionsHandler)
subscriptionRouter.post('/', requirePermission('Subscriptions', 'create'), createSubscriptionHandler)
subscriptionRouter.post(
  '/bulk/status',
  requireAnyPermission([
    { module: 'Subscriptions', action: 'manage' },
    { module: 'Subscriptions', action: 'edit' },
  ]),
  bulkStatusHandler,
)
subscriptionRouter.get('/:id', requirePermission('Subscriptions', 'view'), getSubscriptionHandler)
subscriptionRouter.patch('/:id', requirePermission('Subscriptions', 'edit'), updateSubscriptionHandler)
subscriptionRouter.put('/:id', requirePermission('Subscriptions', 'edit'), updateSubscriptionHandler)
subscriptionRouter.patch(
  '/:id/status',
  requireAnyPermission([
    { module: 'Subscriptions', action: 'manage' },
    { module: 'Subscriptions', action: 'edit' },
  ]),
  updateSubscriptionStatusHandler,
)
subscriptionRouter.post(
  '/:id/renew',
  requireAnyPermission([
    { module: 'Subscriptions', action: 'manage' },
    { module: 'Subscriptions', action: 'edit' },
  ]),
  renewSubscriptionHandler,
)

export { subscriptionRouter }
