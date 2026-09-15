import { Router } from 'express'
import {
  bulkDeleteHandler,
  bulkStatusHandler,
  deleteAdminUserHandler,
  getAdminUserHandler,
  getAdminUserPermissionsHandler,
  inviteAdminUserHandler,
  listAdminUsersHandler,
  listRolesHandler,
  restoreAdminUserHandler,
  updateAdminUserHandler,
  updateAdminUserStatusHandler,
  updateRolePermissionsHandler,
} from '../controllers/adminUser.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAnyPermission, requirePermission } from '../middleware/rbac.middleware.js'

const adminUserRouter = Router()

adminUserRouter.use(requireAuth)

adminUserRouter.get('/', requirePermission('Admin Users', 'view'), listAdminUsersHandler)
adminUserRouter.get('/roles', requirePermission('Admin Users', 'view'), listRolesHandler)
adminUserRouter.patch(
  '/roles/:roleCode/permissions',
  requirePermission('Admin Users', 'manage'),
  updateRolePermissionsHandler,
)
adminUserRouter.post(
  '/invite',
  requireAnyPermission([
    { module: 'Admin Users', action: 'create' },
    { module: 'Admin Users', action: 'manage' },
  ]),
  inviteAdminUserHandler,
)
adminUserRouter.post(
  '/bulk/status',
  requireAnyPermission([
    { module: 'Admin Users', action: 'manage' },
    { module: 'Admin Users', action: 'edit' },
  ]),
  bulkStatusHandler,
)
adminUserRouter.post(
  '/bulk/delete',
  requireAnyPermission([
    { module: 'Admin Users', action: 'delete' },
    { module: 'Admin Users', action: 'manage' },
  ]),
  bulkDeleteHandler,
)
adminUserRouter.get('/:id', requirePermission('Admin Users', 'view'), getAdminUserHandler)
adminUserRouter.get(
  '/:id/permissions',
  requirePermission('Admin Users', 'view'),
  getAdminUserPermissionsHandler,
)
adminUserRouter.patch('/:id', requirePermission('Admin Users', 'edit'), updateAdminUserHandler)
adminUserRouter.put('/:id', requirePermission('Admin Users', 'edit'), updateAdminUserHandler)
adminUserRouter.patch(
  '/:id/status',
  requireAnyPermission([
    { module: 'Admin Users', action: 'manage' },
    { module: 'Admin Users', action: 'edit' },
  ]),
  updateAdminUserStatusHandler,
)
adminUserRouter.delete(
  '/:id',
  requireAnyPermission([
    { module: 'Admin Users', action: 'delete' },
    { module: 'Admin Users', action: 'manage' },
  ]),
  deleteAdminUserHandler,
)
adminUserRouter.patch(
  '/:id/restore',
  requireAnyPermission([
    { module: 'Admin Users', action: 'delete' },
    { module: 'Admin Users', action: 'manage' },
  ]),
  restoreAdminUserHandler,
)

export { adminUserRouter }
