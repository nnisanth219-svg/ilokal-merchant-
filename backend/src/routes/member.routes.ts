import { Router } from 'express'
import {
  bulkDeleteHandler,
  bulkRestoreHandler,
  bulkStatusHandler,
  broadcastMembersHandler,
  createMemberHandler,
  deleteMemberHandler,
  getMemberHandler,
  listMembersHandler,
  restoreMemberHandler,
  updateMemberHandler,
  updateMemberStatusHandler,
} from '../controllers/member.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAnyPermission, requirePermission } from '../middleware/rbac.middleware.js'

const memberRouter = Router()

memberRouter.use(requireAuth)

memberRouter.get('/', requirePermission('Members', 'view'), listMembersHandler)
memberRouter.post('/', requirePermission('Members', 'create'), createMemberHandler)
memberRouter.post(
  '/broadcast',
  requireAnyPermission([
    { module: 'Members', action: 'manage' },
    { module: 'Members', action: 'edit' },
  ]),
  broadcastMembersHandler,
)
memberRouter.post(
  '/bulk/status',
  requireAnyPermission([
    { module: 'Members', action: 'manage' },
    { module: 'Members', action: 'edit' },
  ]),
  bulkStatusHandler,
)
memberRouter.post(
  '/bulk/delete',
  requireAnyPermission([
    { module: 'Members', action: 'delete' },
    { module: 'Members', action: 'manage' },
  ]),
  bulkDeleteHandler,
)
memberRouter.post(
  '/bulk/restore',
  requireAnyPermission([
    { module: 'Members', action: 'delete' },
    { module: 'Members', action: 'manage' },
  ]),
  bulkRestoreHandler,
)
memberRouter.get('/:id', requirePermission('Members', 'view'), getMemberHandler)
memberRouter.patch('/:id', requirePermission('Members', 'edit'), updateMemberHandler)
memberRouter.put('/:id', requirePermission('Members', 'edit'), updateMemberHandler)
memberRouter.patch(
  '/:id/status',
  requireAnyPermission([
    { module: 'Members', action: 'manage' },
    { module: 'Members', action: 'edit' },
  ]),
  updateMemberStatusHandler,
)
memberRouter.delete(
  '/:id',
  requireAnyPermission([
    { module: 'Members', action: 'delete' },
    { module: 'Members', action: 'manage' },
  ]),
  deleteMemberHandler,
)
memberRouter.patch(
  '/:id/restore',
  requireAnyPermission([
    { module: 'Members', action: 'delete' },
    { module: 'Members', action: 'manage' },
  ]),
  restoreMemberHandler,
)

export { memberRouter }
