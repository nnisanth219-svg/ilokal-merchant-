import { Router } from 'express'
import {
  getAuditLogHandler,
  listAuditLogsHandler,
} from '../controllers/auditLog.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/rbac.middleware.js'

const auditLogRouter = Router()

auditLogRouter.use(requireAuth)

auditLogRouter.get('/', requirePermission('Audit Log', 'view'), listAuditLogsHandler)
auditLogRouter.get('/:id', requirePermission('Audit Log', 'view'), getAuditLogHandler)

export { auditLogRouter }
