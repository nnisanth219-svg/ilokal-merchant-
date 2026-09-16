import type { SubscriptionStatus } from '../../types/subscription'

const STYLES: Record<SubscriptionStatus, string> = {
  active: 'bg-[#E8F6F0] text-success',
  expired: 'bg-[#F0EEEA] text-muted',
  suspended: 'bg-[#FFF4D6] text-[#A67A00]',
  cancelled: 'bg-[#FDECEC] text-action',
}

const LABELS: Record<SubscriptionStatus, string> = {
  active: 'Active',
  expired: 'Expired',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
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
