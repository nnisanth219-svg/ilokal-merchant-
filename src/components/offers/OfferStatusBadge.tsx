import type { OfferStatus } from '../../types/offer'

const STATUS_STYLES: Record<OfferStatus, string> = {
  live: 'bg-[#E8F6F0] text-success',
  scheduled: 'bg-[#E8EEF8] text-navy',
  draft: 'bg-[#F0EEEA] text-muted',
  expired: 'bg-[#EDEDED] text-[#9A9A9A]',
  paused: 'bg-[#FFF4D6] text-[#A67A00]',
}

const STATUS_LABELS: Record<OfferStatus, string> = {
  live: 'Live',
  scheduled: 'Scheduled',
  draft: 'Draft',
  expired: 'Expired',
  paused: 'Paused',
}

interface OfferStatusBadgeProps {
  status: OfferStatus
}

export function OfferStatusBadge({ status }: OfferStatusBadgeProps) {
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
