import { Router } from 'express'
import {
  getAllSettingsHandler,
  getSettingHandler,
  updateAllSettingsHandler,
  updateSettingHandler,
} from '../controllers/settings.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAnyPermission, requirePermission } from '../middleware/rbac.middleware.js'

const settingsRouter = Router()

settingsRouter.use(requireAuth)

settingsRouter.get('/', requirePermission('Settings', 'view'), getAllSettingsHandler)
settingsRouter.patch(
  '/',
  requireAnyPermission([
    { module: 'Settings', action: 'manage' },
    { module: 'Settings', action: 'edit' },
  ]),
  updateAllSettingsHandler,
)
settingsRouter.put(
  '/',
  requireAnyPermission([
    { module: 'Settings', action: 'manage' },
    { module: 'Settings', action: 'edit' },
  ]),
  updateAllSettingsHandler,
)
settingsRouter.get('/:key', requirePermission('Settings', 'view'), getSettingHandler)
settingsRouter.patch(
  '/:key',
  requireAnyPermission([
    { module: 'Settings', action: 'manage' },
    { module: 'Settings', action: 'edit' },
  ]),
  updateSettingHandler,
)
settingsRouter.put(
  '/:key',
  requireAnyPermission([
    { module: 'Settings', action: 'manage' },
    { module: 'Settings', action: 'edit' },
  ]),
  updateSettingHandler,
)

export { settingsRouter }
