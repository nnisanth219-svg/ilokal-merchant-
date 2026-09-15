import { Router } from 'express'
import {
  bulkDeleteHandler,
  bulkStatusHandler,
  createReviewHandler,
  deleteReviewHandler,
  getReviewHandler,
  listReviewsHandler,
  updateReviewHandler,
  updateReviewStatusHandler,
} from '../controllers/review.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAnyPermission, requirePermission } from '../middleware/rbac.middleware.js'

const reviewRouter = Router()

reviewRouter.use(requireAuth)

reviewRouter.get('/', requirePermission('Reviews', 'view'), listReviewsHandler)
reviewRouter.post('/', requirePermission('Reviews', 'create'), createReviewHandler)
reviewRouter.post(
  '/bulk/status',
  requireAnyPermission([
    { module: 'Reviews', action: 'manage' },
    { module: 'Reviews', action: 'edit' },
  ]),
  bulkStatusHandler,
)
reviewRouter.post(
  '/bulk/delete',
  requireAnyPermission([
    { module: 'Reviews', action: 'delete' },
    { module: 'Reviews', action: 'manage' },
  ]),
  bulkDeleteHandler,
)
reviewRouter.get('/:id', requirePermission('Reviews', 'view'), getReviewHandler)
reviewRouter.patch('/:id', requirePermission('Reviews', 'edit'), updateReviewHandler)
reviewRouter.put('/:id', requirePermission('Reviews', 'edit'), updateReviewHandler)
reviewRouter.patch(
  '/:id/status',
  requireAnyPermission([
    { module: 'Reviews', action: 'manage' },
    { module: 'Reviews', action: 'edit' },
  ]),
  updateReviewStatusHandler,
)
reviewRouter.delete(
  '/:id',
  requireAnyPermission([
    { module: 'Reviews', action: 'delete' },
    { module: 'Reviews', action: 'manage' },
  ]),
  deleteReviewHandler,
)

export { reviewRouter }
