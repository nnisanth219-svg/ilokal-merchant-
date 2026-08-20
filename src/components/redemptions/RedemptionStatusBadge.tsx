import type { RedemptionStatus } from '../../types/redemption'

const STYLES: Record<RedemptionStatus, string> = {
  successful: 'bg-[#E8F6F0] text-success',
  failed: 'bg-[#FDECEC] text-action',
  cancelled: 'bg-[#F0EEEA] text-muted',
}

const LABELS: Record<RedemptionStatus, string> = {
  successful: 'Successful',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

export function RedemptionStatusBadge({ status }: { status: RedemptionStatus }) {
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
