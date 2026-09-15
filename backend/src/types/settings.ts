export type SettingKey = 'general' | 'security' | 'notifications'

export interface GeneralSettings {
  platformName: string
  adminPortalName: string
  supportEmail: string
  defaultCountry: string
  timezone: string
  dateFormat: string
  language: string
}

export interface SecuritySettings {
  sessionTimeoutMinutes: number
  twoFactorEnabled: boolean
  passwordMinLength: number
  requireStrongPassword: boolean
  lockoutAfterFailures: number
}

export interface NotificationSettings {
  newAdminInvitation: boolean
  merchantApproval: boolean
  offerStatusChanges: boolean
  redemptionAlerts: boolean
  systemNotifications: boolean
}

export interface AppSettingsState {
  general: GeneralSettings
  security: SecuritySettings
  notifications: NotificationSettings
}

export const SETTING_KEYS: SettingKey[] = ['general', 'security', 'notifications']

export const DEFAULT_SETTINGS: AppSettingsState = {
  general: {
    platformName: 'iLokal',
    adminPortalName: 'iLokal Admin',
    supportEmail: 'support@ilokal.my',
    defaultCountry: 'Malaysia',
    timezone: 'Asia/Kuala_Lumpur',
    dateFormat: 'DD MMM YYYY',
    language: 'English',
  },
  security: {
    sessionTimeoutMinutes: 30,
    twoFactorEnabled: true,
    passwordMinLength: 10,
    requireStrongPassword: true,
    lockoutAfterFailures: 5,
  },
  notifications: {
    newAdminInvitation: true,
    merchantApproval: true,
    offerStatusChanges: true,
    redemptionAlerts: false,
    systemNotifications: true,
  },
}
