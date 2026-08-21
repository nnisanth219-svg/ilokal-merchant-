import type { AppSettingsState } from '../types/settings'

export const initialSettings: AppSettingsState = {
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
