import type { ReviewStatus } from '../../types/review'

const STYLES: Record<ReviewStatus, string> = {
  published: 'bg-[#E8F6F0] text-success',
  pending: 'bg-[#FFF4D6] text-[#A67A00]',
  flagged: 'bg-[#FDECEC] text-action',
  hidden: 'bg-[#F0EEEA] text-muted',
}

const LABELS: Record<ReviewStatus, string> = {
  published: 'Published',
  pending: 'Pending',
  flagged: 'Flagged',
  hidden: 'Hidden',
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
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
