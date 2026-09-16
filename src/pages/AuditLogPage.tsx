import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AuditStatusBadge } from '../components/audit/AuditStatusBadge'
import {
  CMS_PAGE_SIZE,
  FilterPill,
  formatDateTime,
  pageWindow,
  PagerButton,
  SearchIcon,
  SummaryCard,
  Th,
} from '../components/cms/AdminListPrimitives'
import {
  getAuditLogApi,
  listAuditLogsApi,
  type AuditLogListResponse,
} from '../services/auditLogApi'
import {
  AUDIT_ACTION_FILTERS,
  AUDIT_MODULE_FILTERS,
  AUDIT_STATUS_FILTERS,
  type AuditLogEntry,
  type AuditStatus,
} from '../types/auditLog'

type StatusFilter = AuditStatus | 'all'
type DateFilter = 'any' | '7d' | '30d' | '90d'

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

export function AuditLogPage() {
  const [items, setItems] = useState<AuditLogEntry[]>([])
  const [summary, setSummary] = useState<AuditLogListResponse['summary']>({
    total: 0,
    today: 0,
    warnings: 0,
    failed: 0,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: CMS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [adminId, setAdminId] = useState('all')
  const [knownAdmins, setKnownAdmins] = useState<{ id: string; name: string }[]>([])
  const [module, setModule] = useState('all')
  const [action, setAction] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [dateRange, setDateRange] = useState<DateFilter>('any')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<AuditLogEntry | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAuditLogsApi({
        page,
        pageSize: CMS_PAGE_SIZE,
        search: debouncedSearch,
        module,
        action,
        status,
        adminId,
        dateRange,
      })
      setItems(data.logs)
      setSummary(data.summary)
      setPagination(data.pagination)
      setKnownAdmins((prev) => {
        const map = new Map(prev.map((a) => [a.id, a.name]))
        for (const log of data.logs) {
          if (log.adminId) map.set(log.adminId, log.adminName)
        }
        return [...map.entries()]
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name))
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load audit logs')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, module, action, status, adminId, dateRange])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  const adminOptions = useMemo(
    () => [
      { value: 'all', label: 'All admins' },
      ...knownAdmins.map((a) => ({ value: a.id, label: a.name })),
    ],
    [knownAdmins],
  )

  const selectedAdminLabel =
    adminId === 'all'
      ? 'All'
      : (knownAdmins.find((a) => a.id === adminId)?.name ?? adminId)

  const pageItems = items
  const totalPages = Math.max(1, pagination.totalPages)
  const currentPage = Math.min(page, totalPages)
  const total = pagination.total
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * CMS_PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * CMS_PAGE_SIZE, total)
  const pageNumbers = useMemo(
    () => pageWindow(currentPage, totalPages),
    [currentPage, totalPages],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Audit log</h1>
          <p className="mt-0.5 text-[12px] text-muted">
            Track administrator actions across the iLokal platform.
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Total events" value={String(summary.total)} />
          <SummaryCard label="Today" value={String(summary.today)} />
          <SummaryCard label="Warnings" value={String(summary.warnings)} />
          <SummaryCard label="Failed" value={String(summary.failed)} />
        </div>

        {error ? <p className="mb-3 text-[12px] text-action">{error}</p> : null}

        <div className="mb-4 flex shrink-0 flex-col gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 lg:flex-row lg:items-center lg:flex-wrap">
            <div className="relative w-full min-w-0 max-w-none lg:max-w-[320px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search audit events"
                className="h-10 min-h-[40px] w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill
                label="Admin"
                value={adminId}
                displayValue={selectedAdminLabel}
                onChange={(v) => {
                  setAdminId(v)
                  setPage(1)
                }}
                options={adminOptions}
              />
              <FilterPill
                label="Module"
                value={module}
                displayValue={
                  AUDIT_MODULE_FILTERS.find((f) => f.value === module)?.label ?? module
                }
                onChange={(v) => {
                  setModule(v)
                  setPage(1)
                }}
                options={AUDIT_MODULE_FILTERS}
              />
              <FilterPill
                label="Action"
                value={action}
                displayValue={
                  AUDIT_ACTION_FILTERS.find((f) => f.value === action)?.label ?? action
                }
                onChange={(v) => {
                  setAction(v)
                  setPage(1)
                }}
                options={AUDIT_ACTION_FILTERS}
              />
              <FilterPill
                label="Status"
                value={status}
                displayValue={
                  status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)
                }
                onChange={(v) => {
                  setStatus(v as StatusFilter)
                  setPage(1)
                }}
                options={AUDIT_STATUS_FILTERS.map((f) => ({
                  value: f.value,
                  label: f.label,
                }))}
              />
              <FilterPill
                label="Date"
                value={dateRange}
                displayValue={
                  DATE_FILTERS.find((f) => f.value === dateRange)?.label ?? dateRange
                }
                onChange={(v) => {
                  setDateRange(v as DateFilter)
                  setPage(1)
                }}
                options={DATE_FILTERS}
              />
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white">
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="min-w-[1100px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-[#FAF9F6]">
                    <Th>Date & time</Th>
                    <Th>Admin</Th>
                    <Th>Action</Th>
                    <Th>Module</Th>
                    <Th>Description</Th>
                    <Th>Status</Th>
                    <Th>Reason</Th>
                    <Th>IP / device</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading && pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center text-[13px] text-muted">
                        Loading audit events…
                      </td>
                    </tr>
                  ) : null}
                  {pageItems.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-b border-border last:border-b-0 bg-white hover:bg-[#FAFAF8]"
                      onClick={() => setDetail(row)}
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 align-middle text-[13px] text-navy">
                        {formatDateTime(row.occurredAt)}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-[13px] font-medium text-navy">
                        {row.adminName}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                        {row.action}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-[13px] text-muted">
                        {row.module}
                      </td>
                      <td className="max-w-[220px] px-4 py-3.5 align-middle text-[13px] text-muted">
                        <span className="line-clamp-2">{row.description}</span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <AuditStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3.5 align-middle text-[13px] text-muted">
                        {row.reason}
                      </td>
                      <td className="max-w-[200px] px-4 py-3.5 align-middle text-[12px] text-muted">
                        <span className="line-clamp-2">{row.ipLabel}</span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDetail(row)
                          }}
                          className="text-[13px] font-semibold text-navy hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center text-[13px] text-muted">
                        No audit events match your filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-muted">
              Showing {rangeStart}–{rangeEnd} of {total}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <PagerButton
                label="Previous"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              />
              {pageNumbers.map((n) => (
                <PagerButton
                  key={n}
                  label={String(n)}
                  active={currentPage === n}
                  onClick={() => setPage(n)}
                />
              ))}
              <PagerButton
                label="Next"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            </div>
          </div>
        </div>
      </div>

      {detail
        ? createPortal(
            <AuditDetailDrawer entry={detail} onClose={() => setDetail(null)} />,
            document.body,
          )
        : null}
    </div>
  )
}

function AuditDetailDrawer({
  entry,
  onClose,
}: {
  entry: AuditLogEntry
  onClose: () => void
}) {
  const [detail, setDetail] = useState(entry)

  useEffect(() => {
    setDetail(entry)
    let cancelled = false
    getAuditLogApi(entry.id)
      .then((full) => {
        if (!cancelled) setDetail(full)
      })
      .catch(() => {
        /* keep list-row data */
      })
    return () => {
      cancelled = true
    }
  }, [entry])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close audit detail"
        className="absolute inset-0 bg-navy/40"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Audit detail
            </p>
            <h2 className="mt-1 text-[16px] font-bold text-navy">{detail.action}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-border text-navy hover:bg-page"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <dl className="space-y-4">
            <DetailRow label="Action" value={detail.action} />
            <DetailRow label="Admin" value={detail.adminName} />
            <DetailRow label="Date & time" value={formatDateTime(detail.occurredAt)} />
            <DetailRow label="Module" value={detail.module} />
            <DetailRow label="Target" value={detail.target ?? '—'} />
            <DetailRow label="Description" value={detail.description} />
            <DetailRow label="Reason" value={detail.reason} />
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Status
              </dt>
              <dd className="mt-1.5">
                <AuditStatusBadge status={detail.status} />
              </dd>
            </div>
            {detail.previousValue ? (
              <DetailRow label="Previous value" value={detail.previousValue} />
            ) : null}
            {detail.newValue ? <DetailRow label="New value" value={detail.newValue} /> : null}
            <DetailRow label="IP / device" value={detail.ipLabel} />
          </dl>
        </div>

        <div className="border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white hover:bg-navy-secondary"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-1 text-[13px] text-navy">{value}</dd>
    </div>
  )
}
