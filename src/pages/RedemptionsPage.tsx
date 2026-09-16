import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RedemptionStatusBadge } from '../components/redemptions/RedemptionStatusBadge'
import {
  BulkBtn,
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
  RowActionButton,
  ViewportAwareMenu,
  type ViewportMenuItem,
} from '../components/ui/ViewportAwareMenu'
import {
  listRedemptionsApi,
  type RedemptionListResponse,
} from '../services/redemptionApi'
import {
  REDEMPTION_STATUS_FILTERS,
  type Redemption,
  type RedemptionStatus,
} from '../types/redemption'
import { downloadCsv } from '../utils/csv'
import { collectAllPages } from '../utils/paginate'

type StatusFilter = RedemptionStatus | 'all'
type DateFilter = 'any' | '7d' | '30d' | '90d'

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

export function RedemptionsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState<Redemption[]>([])
  const [summary, setSummary] = useState<RedemptionListResponse['summary']>({
    total: 0,
    today: 0,
    thisMonth: 0,
    successful: 0,
  })
  const [filterOptions, setFilterOptions] = useState<RedemptionListResponse['filterOptions']>({
    members: [],
    merchants: [],
    offers: [],
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
  const [merchant, setMerchant] = useState(() => searchParams.get('merchantId') || 'all')
  const [member, setMember] = useState('all')
  const [offer, setOffer] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('any')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [exportMsg, setExportMsg] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Record<string, Redemption>>({})

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const urlMerchant = searchParams.get('merchantId') || 'all'
  useEffect(() => {
    setMerchant(urlMerchant)
    setPage(1)
  }, [urlMerchant])

  const loadRedemptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listRedemptionsApi({
        page,
        pageSize: CMS_PAGE_SIZE,
        search: debouncedSearch,
        status,
        memberId: member,
        merchantId: merchant,
        offerId: offer,
        date: dateFilter,
      })
      setItems(data.redemptions)
      setSummary(data.summary)
      setFilterOptions(data.filterOptions)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load redemptions')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status, member, merchant, offer, dateFilter])

  useEffect(() => {
    void loadRedemptions()
  }, [loadRedemptions])

  const merchantOptions = useMemo(
    () => filterOptions.merchants.map((m) => ({ value: m.id, label: m.name })),
    [filterOptions.merchants],
  )
  const memberOptions = useMemo(
    () => filterOptions.members.map((m) => ({ value: m.id, label: m.name })),
    [filterOptions.members],
  )
  const offerOptions = useMemo(
    () => filterOptions.offers.map((o) => ({ value: o.id, label: o.title })),
    [filterOptions.offers],
  )

  const pageItems = items
  const totalPages = Math.max(1, pagination.totalPages)
  const currentPage = Math.min(page, totalPages)
  const total = pagination.total
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * CMS_PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * CMS_PAGE_SIZE, total)
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((r) => selectedIds.includes(r.id))
  const pageNumbers = useMemo(
    () => pageWindow(currentPage, totalPages),
    [currentPage, totalPages],
  )

  const activeItem = pageItems.find((r) => r.id === openMenuId) ?? null

  const menuItems: ViewportMenuItem[] = activeItem
    ? [
        {
          id: 'view',
          label: 'View redemption',
          onClick: () => navigate(`/redemptions/${activeItem.id}`),
        },
        {
          id: 'member',
          label: 'View member',
          onClick: () => navigate(`/members/${activeItem.memberId}`),
        },
        {
          id: 'merchant',
          label: 'View merchant',
          onClick: () => navigate(`/merchants/${activeItem.merchantId}`),
        },
        {
          id: 'offer',
          label: 'View offer',
          onClick: () => navigate(`/offers/${activeItem.offerId}`),
        },
      ]
    : []

  function closeMenu(): void {
    setOpenMenuId(null)
    setMenuAnchor(null)
  }

  function toggleMenu(id: string, el: HTMLButtonElement): void {
    if (openMenuId === id) {
      closeMenu()
      return
    }
    setOpenMenuId(id)
    setMenuAnchor(el)
  }

  function toggleSelectAll(): void {
    if (allPageSelected) {
      const pageIds = new Set(pageItems.map((r) => r.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)))
      setSelectedRows((prev) => {
        const next = { ...prev }
        pageItems.forEach((row) => {
          delete next[row.id]
        })
        return next
      })
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      pageItems.forEach((r) => next.add(r.id))
      return [...next]
    })
    setSelectedRows((prev) => {
      const next = { ...prev }
      pageItems.forEach((row) => {
        next[row.id] = row
      })
      return next
    })
  }

  function toggleSelect(row: Redemption): void {
    setSelectedIds((prev) => (prev.includes(row.id) ? prev.filter((x) => x !== row.id) : [...prev, row.id]))
    setSelectedRows((prev) => {
      const next = { ...prev }
      if (next[row.id]) delete next[row.id]
      else next[row.id] = row
      return next
    })
  }

  function redemptionCsvRows(rows: Redemption[]): Array<Array<string>> {
    return rows.map((row) => [
      row.redemptionCode,
      row.memberName,
      row.merchantName,
      row.offerTitle,
      row.redeemedAt,
      row.method,
      row.status,
    ])
  }

  async function handleExport(): Promise<void> {
    try {
      setError(null)
      setExporting(true)
      const all = await collectAllPages(async (pageNum, pageSize) => {
        const data = await listRedemptionsApi({
          page: pageNum,
          pageSize,
          search: debouncedSearch,
          status,
          memberId: member,
          merchantId: merchant,
          offerId: offer,
          date: dateFilter,
        })
        return { items: data.redemptions, totalPages: data.pagination.totalPages }
      })
      downloadCsv(
        'redemptions.csv',
        ['redemptionCode', 'member', 'merchant', 'offer', 'redeemedAt', 'method', 'status'],
        redemptionCsvRows(all),
      )
      setExportMsg(`Exported ${all.length} redemptions`)
      window.setTimeout(() => setExportMsg(null), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export redemptions')
    } finally {
      setExporting(false)
    }
  }

  function handleBulkExport(): void {
    const rows = selectedIds.map((id) => selectedRows[id]).filter(Boolean)
    if (rows.length === 0) {
      setError('Select redemptions to export.')
      return
    }
    downloadCsv(
      'redemptions-selected.csv',
      ['redemptionCode', 'member', 'merchant', 'offer', 'redeemedAt', 'method', 'status'],
      redemptionCsvRows(rows),
    )
    setExportMsg(`Exported ${rows.length} selected redemptions`)
    window.setTimeout(() => setExportMsg(null), 2500)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Redemptions</h1>
            <p className="mt-0.5 text-[12px] text-muted">
              Monitor member offer redemptions and redemption activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {exportMsg ? (
              <span className="text-[12px] font-semibold text-success">{exportMsg}</span>
            ) : null}
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
              className="inline-flex h-10 min-h-[40px] items-center rounded-lg border border-border bg-white px-4 text-[13px] font-semibold text-navy transition hover:bg-page disabled:opacity-60"
            >
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Total redemptions" value={String(summary.total)} />
          <SummaryCard label="Today" value={String(summary.today)} />
          <SummaryCard label="This month" value={String(summary.thisMonth)} />
          <SummaryCard label="Successful" value={String(summary.successful)} />
        </div>
        {error ? <p className="mb-3 text-[12px] text-action">{error}</p> : null}

        <div className="mb-4 flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 lg:flex-row lg:items-center">
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
                placeholder="Search redemption ID, member, merchant or offer"
                className="h-10 min-h-[40px] w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill
                label="Merchant"
                value={merchant}
                displayValue={
                  merchant === 'all'
                    ? 'All'
                    : merchantOptions.find((o) => o.value === merchant)?.label ?? 'All'
                }
                onChange={(v) => {
                  setMerchant(v)
                  setPage(1)
                }}
                options={[
                  { value: 'all', label: 'All' },
                  ...merchantOptions,
                  ...(merchant !== 'all' && !merchantOptions.some((o) => o.value === merchant)
                    ? [{ value: merchant, label: 'Selected merchant' }]
                    : []),
                ]}
              />
              <FilterPill
                label="Member"
                value={member}
                displayValue={
                  member === 'all'
                    ? 'All'
                    : memberOptions.find((o) => o.value === member)?.label ?? 'All'
                }
                onChange={(v) => {
                  setMember(v)
                  setPage(1)
                }}
                options={[{ value: 'all', label: 'All' }, ...memberOptions]}
              />
              <FilterPill
                label="Offer"
                value={offer}
                displayValue={
                  offer === 'all'
                    ? 'All'
                    : offerOptions.find((o) => o.value === offer)?.label ?? 'All'
                }
                onChange={(v) => {
                  setOffer(v)
                  setPage(1)
                }}
                options={[{ value: 'all', label: 'All' }, ...offerOptions]}
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
                options={REDEMPTION_STATUS_FILTERS.map((f) => ({
                  value: f.value,
                  label: f.label,
                }))}
              />
              <FilterPill
                label="Date"
                value={dateFilter}
                displayValue={
                  DATE_FILTERS.find((f) => f.value === dateFilter)?.label ?? 'Any time'
                }
                onChange={(v) => {
                  setDateFilter(v as DateFilter)
                  setPage(1)
                }}
                options={DATE_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
              />
            </div>
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3 rounded-xl bg-navy px-4 py-3">
            <span className="text-[13px] font-semibold text-white">
              {selectedIds.length} selected
            </span>
            <span className="text-[12px] font-medium text-white/55">Bulk:</span>
            <BulkBtn label="Export selected" onClick={handleBulkExport} />
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="inline-flex h-10 min-h-[40px] items-center rounded-md border border-white/25 bg-white/10 px-3 text-[12px] font-semibold text-white hover:bg-white/15"
            >
              Clear
            </button>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white">
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="min-w-[1080px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-[#FAF9F6]">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all redemptions on page"
                        className="h-[14px] w-[14px] accent-navy"
                      />
                    </th>
                    <Th>Redemption ID</Th>
                    <Th>Member</Th>
                    <Th>Merchant</Th>
                    <Th>Offer</Th>
                    <Th>Date & time</Th>
                    <Th>Method</Th>
                    <Th>Status</Th>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading && pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center text-[13px] text-muted">
                        Loading redemptions…
                      </td>
                    </tr>
                  ) : null}
                  {pageItems.map((row) => {
                    const selected = selectedIds.includes(row.id)
                    return (
                      <tr
                        key={row.id}
                        className={[
                          'border-b border-border last:border-b-0',
                          selected ? 'bg-[#F7F9FC]' : 'bg-white hover:bg-[#FAFAF8]',
                        ].join(' ')}
                      >
                        <td className="px-4 py-3.5 align-middle">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(row)}
                            aria-label={`Select ${row.redemptionCode}`}
                            className="h-[14px] w-[14px] accent-navy"
                          />
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <button
                            type="button"
                            onClick={() => navigate(`/redemptions/${row.id}`)}
                            className="text-[13px] font-semibold tabular-nums text-navy hover:underline"
                          >
                            {row.redemptionCode}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] font-medium text-navy">
                          {row.memberName}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {row.merchantName}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {row.offerTitle}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {formatDateTime(row.redeemedAt)}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {row.method}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <RedemptionStatusBadge status={row.status} />
                        </td>
                        <td className="px-3 py-3.5 align-middle">
                          <RowActionButton
                            label={`Actions for ${row.redemptionCode}`}
                            open={openMenuId === row.id}
                            onToggle={(el) => toggleMenu(row.id, el)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center text-[13px] text-muted">
                        No redemptions match your filters.
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

      <ViewportAwareMenu
        open={Boolean(openMenuId && menuAnchor)}
        anchorEl={menuAnchor}
        items={menuItems}
        onClose={closeMenu}
      />
    </div>
  )
}
