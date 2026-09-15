import { Router } from 'express'
import {
  bulkDeleteHandler,
  bulkStatusHandler,
  createCategoryHandler,
  deleteCategoryHandler,
  getCategoryHandler,
  listCategoriesHandler,
  restoreCategoryHandler,
  updateCategoryHandler,
  updateCategoryStatusHandler,
} from '../controllers/category.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAnyPermission, requirePermission } from '../middleware/rbac.middleware.js'

const categoryRouter = Router()

categoryRouter.use(requireAuth)

categoryRouter.get('/', requirePermission('Categories', 'view'), listCategoriesHandler)
categoryRouter.post('/', requirePermission('Categories', 'create'), createCategoryHandler)
categoryRouter.post(
  '/bulk/status',
  requireAnyPermission([
    { module: 'Categories', action: 'manage' },
    { module: 'Categories', action: 'edit' },
  ]),
  bulkStatusHandler,
)
categoryRouter.post(
  '/bulk/delete',
  requireAnyPermission([
    { module: 'Categories', action: 'delete' },
    { module: 'Categories', action: 'manage' },
  ]),
  bulkDeleteHandler,
)
categoryRouter.get('/:id', requirePermission('Categories', 'view'), getCategoryHandler)
categoryRouter.patch('/:id', requirePermission('Categories', 'edit'), updateCategoryHandler)
categoryRouter.put('/:id', requirePermission('Categories', 'edit'), updateCategoryHandler)
categoryRouter.patch(
  '/:id/status',
  requireAnyPermission([
    { module: 'Categories', action: 'manage' },
    { module: 'Categories', action: 'edit' },
  ]),
  updateCategoryStatusHandler,
)
categoryRouter.delete(
  '/:id',
  requireAnyPermission([
    { module: 'Categories', action: 'delete' },
    { module: 'Categories', action: 'manage' },
  ]),
  deleteCategoryHandler,
)
categoryRouter.patch(
  '/:id/restore',
  requireAnyPermission([
    { module: 'Categories', action: 'delete' },
    { module: 'Categories', action: 'manage' },
  ]),
  restoreCategoryHandler,
)

export { categoryRouter }
