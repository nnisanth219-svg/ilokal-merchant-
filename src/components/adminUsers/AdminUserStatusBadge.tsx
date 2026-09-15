import type { AdminUserStatus } from '../../types/adminUser'

const STYLES: Record<AdminUserStatus, string> = {
  active: 'bg-[#E8F6F0] text-success',
  pending: 'bg-[#FFF4D6] text-[#A67A00]',
  inactive: 'bg-[#F0EEEA] text-muted',
  deleted: 'bg-[#FCE8E8] text-action',
}

const LABELS: Record<AdminUserStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  inactive: 'Inactive',
  deleted: 'Deleted',
}

export function AdminUserStatusBadge({ status }: { status: AdminUserStatus }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        STYLES[status],
      ].join(' ')}
    >
      {LABELS[status]}
    </span>
  )
}
