import { Router } from 'express'
import {
  bulkDeleteHandler,
  bulkStatusHandler,
  createOfferHandler,
  deleteOfferHandler,
  duplicateOfferHandler,
  getOfferHandler,
  listOfferMerchantsHandler,
  listOffersHandler,
  restoreOfferHandler,
  updateOfferHandler,
  updateOfferStatusHandler,
} from '../controllers/offer.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAnyPermission, requirePermission } from '../middleware/rbac.middleware.js'

const offerRouter = Router()

offerRouter.use(requireAuth)

offerRouter.get('/', requirePermission('Offers', 'view'), listOffersHandler)
offerRouter.get('/meta/merchants', requirePermission('Offers', 'view'), listOfferMerchantsHandler)
offerRouter.post('/', requirePermission('Offers', 'create'), createOfferHandler)
offerRouter.post(
  '/bulk/status',
  requireAnyPermission([
    { module: 'Offers', action: 'manage' },
    { module: 'Offers', action: 'edit' },
  ]),
  bulkStatusHandler,
)
offerRouter.post(
  '/bulk/delete',
  requireAnyPermission([
    { module: 'Offers', action: 'delete' },
    { module: 'Offers', action: 'manage' },
  ]),
  bulkDeleteHandler,
)
offerRouter.get('/:id', requirePermission('Offers', 'view'), getOfferHandler)
offerRouter.patch('/:id', requirePermission('Offers', 'edit'), updateOfferHandler)
offerRouter.put('/:id', requirePermission('Offers', 'edit'), updateOfferHandler)
offerRouter.patch(
  '/:id/status',
  requireAnyPermission([
    { module: 'Offers', action: 'manage' },
    { module: 'Offers', action: 'edit' },
  ]),
  updateOfferStatusHandler,
)
offerRouter.post('/:id/duplicate', requirePermission('Offers', 'create'), duplicateOfferHandler)
offerRouter.delete(
  '/:id',
  requireAnyPermission([
    { module: 'Offers', action: 'delete' },
    { module: 'Offers', action: 'manage' },
  ]),
  deleteOfferHandler,
)
offerRouter.patch(
  '/:id/restore',
  requireAnyPermission([
    { module: 'Offers', action: 'delete' },
    { module: 'Offers', action: 'manage' },
  ]),
  restoreOfferHandler,
)

export { offerRouter }
