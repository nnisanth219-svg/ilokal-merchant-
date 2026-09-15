import type {
  AppSettingsState,
  GeneralSettings,
  NotificationSettings,
  SecuritySettings,
  SettingKey,
} from '../types/settings.js'
import { DEFAULT_SETTINGS, SETTING_KEYS } from '../types/settings.js'
import { AppError } from '../utils/errors.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TIMEZONES = new Set(['Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Jakarta', 'UTC'])
const DATE_FORMATS = new Set(['DD MMM YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'])
const LANGUAGES = new Set(['English', 'Bahasa Melayu', '中文'])
const SESSION_TIMEOUTS = new Set([15, 30, 60])
const PASSWORD_LENGTHS = new Set([8, 10, 12, 14])
const LOCKOUTS = new Set([3, 5, 10])

export function isSettingKey(key: string): key is SettingKey {
  return (SETTING_KEYS as string[]).includes(key)
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new AppError(400, `${field} must be a string`)
  return value.trim()
}

function asBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new AppError(400, `${field} must be a boolean`)
  return value
}

function asNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new AppError(400, `${field} must be a number`)
  }
  return value
}

export function parseGeneralSettings(body: unknown): GeneralSettings {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid general settings')
  const raw = body as Record<string, unknown>
  const platformName = asString(raw.platformName, 'platformName')
  const adminPortalName = asString(raw.adminPortalName, 'adminPortalName')
  const supportEmail = asString(raw.supportEmail, 'supportEmail').toLowerCase()
  const defaultCountry = asString(raw.defaultCountry, 'defaultCountry')
  const timezone = asString(raw.timezone, 'timezone')
  const dateFormat = asString(raw.dateFormat, 'dateFormat')
  const language = asString(raw.language, 'language')

  if (!platformName) throw new AppError(400, 'platformName is required')
  if (!adminPortalName) throw new AppError(400, 'adminPortalName is required')
  if (!EMAIL_PATTERN.test(supportEmail)) throw new AppError(400, 'Enter a valid support email')
  if (!defaultCountry) throw new AppError(400, 'defaultCountry is required')
  if (!TIMEZONES.has(timezone)) throw new AppError(400, 'Invalid timezone')
  if (!DATE_FORMATS.has(dateFormat)) throw new AppError(400, 'Invalid date format')
  if (!LANGUAGES.has(language)) throw new AppError(400, 'Invalid language')

  return {
    platformName,
    adminPortalName,
    supportEmail,
    defaultCountry,
    timezone,
    dateFormat,
    language,
  }
}

export function parseSecuritySettings(body: unknown): SecuritySettings {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid security settings')
  const raw = body as Record<string, unknown>
  const sessionTimeoutMinutes = asNumber(raw.sessionTimeoutMinutes, 'sessionTimeoutMinutes')
  const twoFactorEnabled = asBoolean(raw.twoFactorEnabled, 'twoFactorEnabled')
  const passwordMinLength = asNumber(raw.passwordMinLength, 'passwordMinLength')
  const requireStrongPassword = asBoolean(raw.requireStrongPassword, 'requireStrongPassword')
  const lockoutAfterFailures = asNumber(raw.lockoutAfterFailures, 'lockoutAfterFailures')

  if (!SESSION_TIMEOUTS.has(sessionTimeoutMinutes)) {
    throw new AppError(400, 'Invalid session timeout')
  }
  if (!PASSWORD_LENGTHS.has(passwordMinLength)) {
    throw new AppError(400, 'Invalid password minimum length')
  }
  if (!LOCKOUTS.has(lockoutAfterFailures)) {
    throw new AppError(400, 'Invalid lockout setting')
  }

  return {
    sessionTimeoutMinutes,
    twoFactorEnabled,
    passwordMinLength,
    requireStrongPassword,
    lockoutAfterFailures,
  }
}

export function parseNotificationSettings(body: unknown): NotificationSettings {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid notification settings')
  const raw = body as Record<string, unknown>
  return {
    newAdminInvitation: asBoolean(raw.newAdminInvitation, 'newAdminInvitation'),
    merchantApproval: asBoolean(raw.merchantApproval, 'merchantApproval'),
    offerStatusChanges: asBoolean(raw.offerStatusChanges, 'offerStatusChanges'),
    redemptionAlerts: asBoolean(raw.redemptionAlerts, 'redemptionAlerts'),
    systemNotifications: asBoolean(raw.systemNotifications, 'systemNotifications'),
  }
}

export function parseSettingsSection(
  key: SettingKey,
  body: unknown,
): GeneralSettings | SecuritySettings | NotificationSettings {
  if (key === 'general') return parseGeneralSettings(body)
  if (key === 'security') return parseSecuritySettings(body)
  return parseNotificationSettings(body)
}

export function parseFullSettingsBody(body: unknown): Partial<AppSettingsState> {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid request body')
  const raw = body as Record<string, unknown>
  const result: Partial<AppSettingsState> = {}
  if ('general' in raw) result.general = parseGeneralSettings(raw.general)
  if ('security' in raw) result.security = parseSecuritySettings(raw.security)
  if ('notifications' in raw) {
    result.notifications = parseNotificationSettings(raw.notifications)
  }
  if (!result.general && !result.security && !result.notifications) {
    throw new AppError(400, 'No settings sections provided')
  }
  return result
}

export function defaultForKey(key: SettingKey): AppSettingsState[SettingKey] {
  return structuredClone(DEFAULT_SETTINGS[key])
}
