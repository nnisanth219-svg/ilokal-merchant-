import type { MerchantStatus } from '../../types/merchant'

const STATUS_STYLES: Record<MerchantStatus, string> = {
  active: 'bg-[#E8F6F0] text-success',
  pending: 'bg-[#FFF4D6] text-[#A67A00]',
  inactive: 'bg-[#F0EEEA] text-muted',
  deleted: 'bg-[#EDEDED] text-[#9A9A9A]',
}

const STATUS_LABELS: Record<MerchantStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  inactive: 'Inactive',
  deleted: 'Deleted',
}

interface MerchantStatusBadgeProps {
  status: MerchantStatus
}

export function MerchantStatusBadge({ status }: MerchantStatusBadgeProps) {
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
