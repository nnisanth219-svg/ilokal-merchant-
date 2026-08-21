import type { AuditStatus } from '../../types/auditLog'

const STYLES: Record<AuditStatus, string> = {
  success: 'bg-[#E8F6F0] text-success',
  failed: 'bg-[#FDECEC] text-action',
  warning: 'bg-[#FFF4D6] text-[#A67A00]',
}

const LABELS: Record<AuditStatus, string> = {
  success: 'Success',
  failed: 'Failed',
  warning: 'Warning',
}

export function AuditStatusBadge({ status }: { status: AuditStatus }) {
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
