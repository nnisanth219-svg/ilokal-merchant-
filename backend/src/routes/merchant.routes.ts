import { Router } from 'express'
import {
  bulkCategoryHandler,
  bulkDeleteHandler,
  bulkStatusHandler,
  createMerchantHandler,
  deleteMerchantHandler,
  geocodeMerchantHandler,
  getMerchantHandler,
  importMerchantsHandler,
  listMerchantsHandler,
  restoreMerchantHandler,
  updateMerchantHandler,
  updateMerchantStatusHandler,
} from '../controllers/merchant.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAnyPermission, requirePermission } from '../middleware/rbac.middleware.js'

const merchantRouter = Router()

merchantRouter.use(requireAuth)

merchantRouter.get('/', requirePermission('Merchants', 'view'), listMerchantsHandler)
merchantRouter.post('/', requirePermission('Merchants', 'create'), createMerchantHandler)
merchantRouter.post(
  '/import',
  requirePermission('Merchants', 'create'),
  importMerchantsHandler,
)
merchantRouter.post(
  '/geocode',
  requireAnyPermission([
    { module: 'Merchants', action: 'create' },
    { module: 'Merchants', action: 'edit' },
  ]),
  geocodeMerchantHandler,
)
merchantRouter.post(
  '/bulk/status',
  requireAnyPermission([
    { module: 'Merchants', action: 'manage' },
    { module: 'Merchants', action: 'edit' },
  ]),
  bulkStatusHandler,
)
merchantRouter.post(
  '/bulk/delete',
  requireAnyPermission([
    { module: 'Merchants', action: 'delete' },
    { module: 'Merchants', action: 'manage' },
  ]),
  bulkDeleteHandler,
)
merchantRouter.post(
  '/bulk/category',
  requireAnyPermission([
    { module: 'Merchants', action: 'manage' },
    { module: 'Merchants', action: 'edit' },
  ]),
  bulkCategoryHandler,
)
merchantRouter.get('/:id', requirePermission('Merchants', 'view'), getMerchantHandler)
merchantRouter.patch('/:id', requirePermission('Merchants', 'edit'), updateMerchantHandler)
merchantRouter.put('/:id', requirePermission('Merchants', 'edit'), updateMerchantHandler)
merchantRouter.patch(
  '/:id/status',
  requireAnyPermission([
    { module: 'Merchants', action: 'manage' },
    { module: 'Merchants', action: 'edit' },
  ]),
  updateMerchantStatusHandler,
)
merchantRouter.delete(
  '/:id',
  requireAnyPermission([
    { module: 'Merchants', action: 'delete' },
    { module: 'Merchants', action: 'manage' },
  ]),
  deleteMerchantHandler,
)
merchantRouter.patch(
  '/:id/restore',
  requireAnyPermission([
    { module: 'Merchants', action: 'delete' },
    { module: 'Merchants', action: 'manage' },
  ]),
  restoreMerchantHandler,
)

export { merchantRouter }
