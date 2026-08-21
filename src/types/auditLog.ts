export type AuditStatus = 'success' | 'failed' | 'warning'

export interface AuditLogEntry {
  id: string
  occurredAt: string
  adminId: string
  adminName: string
  action: string
  module: string
  description: string
  status: AuditStatus
  reason: string
  ipLabel: string
  target?: string
  previousValue?: string
  newValue?: string
}

export const AUDIT_MODULE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All modules' },
  { value: 'Merchants', label: 'Merchants' },
  { value: 'Offers', label: 'Offers' },
  { value: 'Members', label: 'Members' },
  { value: 'Admin Users', label: 'Admin Users' },
  { value: 'Settings', label: 'Settings' },
  { value: 'Subscriptions', label: 'Subscriptions' },
  { value: 'Categories', label: 'Categories' },
]

export const AUDIT_ACTION_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All actions' },
  { value: 'Updated merchant', label: 'Updated merchant' },
  { value: 'Deactivated offer', label: 'Deactivated offer' },
  { value: 'Invited admin', label: 'Invited admin' },
  { value: 'Changed role', label: 'Changed role' },
  { value: 'Updated settings', label: 'Updated settings' },
  { value: 'Created category', label: 'Created category' },
  { value: 'Suspended member', label: 'Suspended member' },
]

export const AUDIT_STATUS_FILTERS: { value: AuditStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'warning', label: 'Warning' },
]
