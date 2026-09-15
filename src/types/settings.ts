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

export type SettingKey = keyof AppSettingsState
