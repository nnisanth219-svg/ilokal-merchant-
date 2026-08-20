import type { MemberStatus } from '../../types/member'

const STATUS_STYLES: Record<MemberStatus, string> = {
  active: 'bg-[#E8F6F0] text-success',
  expired: 'bg-[#F0EEEA] text-muted',
  suspended: 'bg-[#FFF4D6] text-[#A67A00]',
  inactive: 'bg-[#EDEDED] text-[#9A9A9A]',
}

const STATUS_LABELS: Record<MemberStatus, string> = {
  active: 'Active',
  expired: 'Expired',
  suspended: 'Suspended',
  inactive: 'Inactive',
}

interface MemberStatusBadgeProps {
  status: MemberStatus
}

export function MemberStatusBadge({ status }: MemberStatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        STATUS_STYLES[status],
      ].join(' ')}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
