import type { CategoryStatus } from '../../types/category'

const STYLES: Record<CategoryStatus, string> = {
  active: 'bg-[#E8F6F0] text-success',
  inactive: 'bg-[#F0EEEA] text-muted',
  deleted: 'bg-[#FCE8E8] text-action',
}

const LABELS: Record<CategoryStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  deleted: 'Deleted',
}

export function CategoryStatusBadge({ status }: { status: CategoryStatus }) {
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
