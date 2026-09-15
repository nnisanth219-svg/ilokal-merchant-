import type { NextFunction, Request, Response } from 'express'
import {
  getAllSettings,
  getSettingByKey,
  updateSettingByKey,
  updateSettingsPartial,
} from '../services/settings.service.js'
import { recordAuditFromRequest } from '../services/auditLog.service.js'
import { AppError } from '../utils/errors.js'
import { isSettingKey } from '../validation/settings.validation.js'

function paramKey(req: Request): string {
  const key = req.params.key
  if (typeof key !== 'string' || !key.trim()) {
    throw new AppError(400, 'Setting key is required')
  }
  return key
}

export async function getAllSettingsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getAllSettings()
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getSettingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const key = paramKey(req)
    const data = await getSettingByKey(key)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function updateSettingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const key = paramKey(req)
    if (!isSettingKey(key)) throw new AppError(404, 'Unknown setting key')
    const previous = await getSettingByKey(key)
    const data = await updateSettingByKey(key, req.body)
    await recordAuditFromRequest(req, {
      action: 'SETTINGS_UPDATE',
      module: 'Settings',
      entityId: key,
      entityLabel: key,
      description: `Updated ${key} settings`,
      previousValue: JSON.stringify(previous),
      newValue: JSON.stringify(data),
      reason: 'Settings saved from admin portal',
    })
    res.status(200).json({ success: true, data, message: 'Settings saved' })
  } catch (error) {
    next(error)
  }
}

export async function updateAllSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const previous = await getAllSettings()
    const data = await updateSettingsPartial(req.body)
    const changed = Object.keys(req.body ?? {}).join(', ')
    await recordAuditFromRequest(req, {
      action: 'SETTINGS_UPDATE',
      module: 'Settings',
      entityLabel: changed || 'settings',
      description: `Updated settings (${changed || 'sections'})`,
      previousValue: JSON.stringify(previous),
      newValue: JSON.stringify(data),
      reason: 'Settings saved from admin portal',
    })
    res.status(200).json({ success: true, data, message: 'Settings saved' })
  } catch (error) {
    next(error)
  }
}
