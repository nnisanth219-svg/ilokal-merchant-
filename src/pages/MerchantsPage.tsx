import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ColumnPicker } from '../components/cms/ColumnPicker'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { MerchantStatusBadge } from '../components/merchants/MerchantStatusBadge'
import {
  RowActionButton,
  ViewportAwareMenu,
  type ViewportMenuItem,
} from '../components/ui/ViewportAwareMenu'
import { useAuth } from '../context/AuthContext'
import { useColumnVisibility } from '../hooks/useColumnVisibility'
import { MERCHANT_CATEGORIES, MALAYSIA_STATES } from '../data/merchants'
import {
  bulkChangeMerchantCategoryApi,
  bulkSoftDeleteMerchantsApi,
  bulkUpdateMerchantStatusApi,
  importMerchantsCsvApi,
  listMerchantsApi,
  restoreMerchantApi,
  softDeleteMerchantApi,
  updateMerchantStatusApi,
} from '../services/merchantApi'
import { downloadCsv, parseCsv } from '../utils/csv'
import { collectAllPages } from '../utils/paginate'
import {
  canCreateInModule,
  canDeleteInModule,
  canEditInModule,
} from '../types/auth'
import type { Merchant, MerchantStatus } from '../types/merchant'

const PAGE_SIZE = 25

type StatusFilter = MerchantStatus | 'all'
type AddedFilter = 'any' | '7d' | '30d' | '90d'
type MerchantColumn = 'category' | 'location' | 'offers' | 'redeemed' | 'status'

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MerchantsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const canEdit = canEditInModule(user, 'Merchants')
  const canDelete = canDeleteInModule(user, 'Merchants')
  const canCreate = canCreateInModule(user, 'Merchants')
  const canMutate = canEdit || canDelete
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [liveCount, setLiveCount] = useState(0)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [category, setCategory] = useState(() => searchParams.get('category') || 'All')
  const [state, setState] = useState('All')
  const [added, setAdded] = useState<AddedFilter>('any')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [confirm, setConfirm] = useState<{
    type: 'activate' | 'deactivate' | 'delete' | 'restore'
    merchant: Merchant
  } | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'deactivate' | 'delete' | 'category' | null>(null)
  const [bulkCategory, setBulkCategory] = useState<string>(MERCHANT_CATEGORIES[0])
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const { visible, setColumnVisible } = useColumnVisibility<MerchantColumn>(
    'ilokal.columns.merchants',
    {
      category: true,
      location: true,
      offers: true,
      redeemed: true,
      status: true,
    },
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const urlCategory = searchParams.get('category') || 'All'
  useEffect(() => {
    setCategory(urlCategory)
    setPage(1)
  }, [urlCategory])

  const loadMerchants = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listMerchantsApi({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        status,
        category,
        state,
        added,
        includeDeleted,
      })
      setMerchants(data.merchants)
      setLiveCount(data.liveCount)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load merchants')
      setMerchants([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status, category, state, added, includeDeleted])

  useEffect(() => {
    void loadMerchants()
  }, [loadMerchants])

  const pageItems = merchants
  const totalPages = Math.max(1, pagination.totalPages)
  const currentPage = Math.min(page, totalPages)
  const total = pagination.total
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, total)
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((m) => selectedIds.includes(m.id))

  const pageNumbers = useMemo(() => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 2) return [1, 2, 3]
    if (currentPage >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages]
    return [currentPage - 1, currentPage, currentPage + 1]
  }, [currentPage, totalPages])

  const activeMerchant = pageItems.find((m) => m.id === openMenuId) ?? null

  const menuItems: ViewportMenuItem[] = activeMerchant
    ? [
        {
          id: 'view',
          label: 'View details',
          onClick: () => navigate(`/merchants/${activeMerchant.id}`),
        },
        ...(canEdit
          ? [
              {
                id: 'edit',
                label: 'Edit merchant',
                onClick: () => navigate(`/merchants/${activeMerchant.id}/edit`),
              },
            ]
          : []),
        ...(activeMerchant.status === 'deleted'
          ? canDelete
            ? [
                {
                  id: 'restore',
                  label: 'Restore',
                  onClick: () => setConfirm({ type: 'restore' as const, merchant: activeMerchant }),
                },
              ]
            : []
          : canEdit
            ? [
                {
                  id: 'activate',
                  label: 'Approve & activate',
                  onClick: () => setConfirm({ type: 'activate' as const, merchant: activeMerchant }),
                },
                {
                  id: 'deactivate',
                  label: 'Deactivate',
                  onClick: () => setConfirm({ type: 'deactivate' as const, merchant: activeMerchant }),
                },
              ]
            : []),
        {
          id: 'offers',
          label: 'Manage offers',
          onClick: () => navigate(`/merchants/${activeMerchant.id}/offers`),
        },
        ...(activeMerchant.status === 'deleted' || !canDelete
          ? []
          : [
              {
                id: 'delete',
                label: 'Delete merchant',
                destructive: true,
                dividerBefore: true,
                onClick: () => setConfirm({ type: 'delete' as const, merchant: activeMerchant }),
              },
            ]),
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
      const pageIds = new Set(pageItems.map((m) => m.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)))
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      pageItems.forEach((m) => next.add(m.id))
      return [...next]
    })
  }

  function toggleSelect(id: string): void {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function runBulk(action: 'activate' | 'deactivate' | 'delete'): Promise<void> {
    try {
      setError(null)
      if (action === 'activate') await bulkUpdateMerchantStatusApi(selectedIds, 'active')
      if (action === 'deactivate') await bulkUpdateMerchantStatusApi(selectedIds, 'inactive')
      if (action === 'delete') await bulkSoftDeleteMerchantsApi(selectedIds)
      setSelectedIds([])
      setBulkConfirm(null)
      await loadMerchants()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update merchants')
      setBulkConfirm(null)
    }
  }

  async function handleConfirm(): Promise<void> {
    if (!confirm) return
    try {
      setError(null)
      if (confirm.type === 'activate') await updateMerchantStatusApi(confirm.merchant.id, 'active')
      if (confirm.type === 'deactivate') await updateMerchantStatusApi(confirm.merchant.id, 'inactive')
      if (confirm.type === 'delete') await softDeleteMerchantApi(confirm.merchant.id)
      if (confirm.type === 'restore') await restoreMerchantApi(confirm.merchant.id)
      setConfirm(null)
      closeMenu()
      await loadMerchants()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update merchant')
      setConfirm(null)
      closeMenu()
    }
  }

  async function handleBulkChangeCategory(): Promise<void> {
    try {
      setError(null)
      await bulkChangeMerchantCategoryApi(selectedIds, bulkCategory)
      setSelectedIds([])
      setBulkConfirm(null)
      await loadMerchants()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change category')
      setBulkConfirm(null)
    }
  }

  async function handleExport(): Promise<void> {
    try {
      setError(null)
      setBusyAction('export')
      const all = await collectAllPages(async (page, pageSize) => {
        const data = await listMerchantsApi({
          page,
          pageSize,
          search: debouncedSearch,
          status,
          category,
          state,
          added,
          includeDeleted,
        })
        return { items: data.merchants, totalPages: data.pagination.totalPages }
      })
      downloadCsv(
        'merchants.csv',
        [
          'merchantCode',
          'businessName',
          'category',
          'city',
          'state',
          'phone',
          'email',
          'status',
          'offersCount',
          'redeemedCount',
          'createdAt',
        ],
        all.map((merchant) => [
          merchant.merchantCode,
          merchant.businessName,
          merchant.category,
          merchant.city,
          merchant.state,
          merchant.phone,
          merchant.email,
          merchant.status,
          merchant.offersCount,
          merchant.redeemedCount,
          merchant.createdAt,
        ]),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export merchants')
    } finally {
      setBusyAction(null)
    }
  }

  async function handleImportFile(file: File | undefined): Promise<void> {
    if (!file) return
    try {
      setError(null)
      setBusyAction('import')
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) {
        setError('The CSV file has no merchant rows to import.')
        return
      }
      const result = await importMerchantsCsvApi(rows)
      const failedNote =
        result.failed.length > 0
          ? ` ${result.failed.length} row(s) failed${
              result.failed[0] ? `: ${result.failed[0].message}` : ''
            }.`
          : ''
      if (result.created === 0) {
        setError(`No merchants were imported.${failedNote}`)
      } else {
        setError(null)
        await loadMerchants()
        if (result.failed.length > 0) {
          setError(`Imported ${result.created} merchant(s).${failedNote}`)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to import merchants')
    } finally {
      setBusyAction(null)
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  function locationLabel(merchant: Merchant): string {
    if (!merchant.state) return merchant.city
    return `${merchant.city}, ${merchant.state}`
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Merchant list</h1>
            <p className="mt-0.5 text-[12px] text-muted">
              Search, filter, bulk actions, row menu → activate / deactivate / soft delete
            </p>
            {loading ? (
              <p className="mt-1 text-[12px] text-muted">Loading…</p>
            ) : null}
            {error ? (
              <p className="mt-1 text-[12px] text-action">{error}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => void handleImportFile(event.target.files?.[0])}
            />
            {canCreate ? (
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                disabled={busyAction === 'import'}
                className="inline-flex h-10 min-h-[40px] items-center rounded-lg border border-border bg-white px-4 text-[13px] font-semibold text-navy transition hover:bg-page disabled:opacity-60"
              >
                {busyAction === 'import' ? 'Importing…' : 'Import CSV'}
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex h-10 min-h-[40px] items-center rounded-lg border border-border bg-white px-4 text-[13px] font-semibold text-navy transition hover:bg-page"
                disabled
              >
                Import CSV
              </button>
            )}
            {canCreate ? (
              <Link
                to="/merchants/create"
                className="inline-flex h-10 min-h-[40px] items-center rounded-lg bg-action px-4 text-[13px] font-semibold text-white transition hover:bg-[#c82027]"
              >
                + New merchant
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 shrink-0">
          <p className="text-[15px] font-semibold text-navy">
            Merchants · <span className="text-muted">{liveCount} live</span>
          </p>
        </div>

        <div className="mb-4 flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="relative w-full min-w-0 max-w-none lg:max-w-[300px]">
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
                placeholder="Search by name, city, phone, reg. no."
                className="h-10 min-h-[40px] w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill
                label="Status"
                value={status}
                displayValue={status === 'all' ? 'Active' : status.charAt(0).toUpperCase() + status.slice(1)}
                onChange={(v) => {
                  setStatus(v as StatusFilter)
                  setPage(1)
                }}
                options={[
                  { value: 'all', label: 'Active' },
                  { value: 'active', label: 'Active only' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'deleted', label: 'Deleted' },
                ]}
              />
              <FilterPill
                label="Category"
                value={category}
                onChange={(v) => {
                  setCategory(v)
                  setPage(1)
                }}
                options={[
                  { value: 'All', label: 'All' },
                  ...MERCHANT_CATEGORIES.map((c) => ({ value: c, label: c })),
                  ...(category !== 'All' &&
                  !(MERCHANT_CATEGORIES as readonly string[]).includes(category)
                    ? [{ value: category, label: category }]
                    : []),
                ]}
              />
              <FilterPill
                label="State"
                value={state}
                onChange={(v) => {
                  setState(v)
                  setPage(1)
                }}
                options={MALAYSIA_STATES.map((s) => ({ value: s, label: s }))}
              />
              <FilterPill
                label="Added"
                value={added}
                displayValue={
                  added === 'any'
                    ? 'Any time'
                    : added === '7d'
                      ? 'Last 7 days'
                      : added === '30d'
                        ? 'Last 30 days'
                        : 'Last 90 days'
                }
                onChange={(v) => {
                  setAdded(v as AddedFilter)
                  setPage(1)
                }}
                options={[
                  { value: 'any', label: 'Any time' },
                  { value: '7d', label: 'Last 7 days' },
                  { value: '30d', label: 'Last 30 days' },
                  { value: '90d', label: 'Last 90 days' },
                ]}
              />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={busyAction === 'export'}
              className="inline-flex h-10 min-h-[40px] items-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page disabled:opacity-60"
            >
              {busyAction === 'export' ? 'Exporting…' : 'Export'}
            </button>
            <ColumnPicker
              columns={[
                { key: 'category', label: 'Category' },
                { key: 'location', label: 'City / State' },
                { key: 'offers', label: 'Offers' },
                { key: 'redeemed', label: 'Redeemed' },
                { key: 'status', label: 'Status' },
              ]}
              visible={visible}
              onChange={setColumnVisible}
            />
          </div>
        </div>

        {selectedIds.length > 0 && canMutate ? (
          <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3 rounded-xl bg-navy px-4 py-3">
            <span className="text-[13px] font-semibold text-white">
              {selectedIds.length} selected
            </span>
            <span className="text-[12px] font-medium text-white/55">Bulk:</span>
            {canEdit ? (
              <>
                <BulkBtn label="Activate" onClick={() => setBulkConfirm('activate')} />
                <BulkBtn label="Deactivate" onClick={() => setBulkConfirm('deactivate')} />
                <BulkBtn label="Change category" onClick={() => setBulkConfirm('category')} />
              </>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                onClick={() => setBulkConfirm('delete')}
                className="inline-flex h-10 min-h-[40px] items-center rounded-md bg-action px-3 text-[12px] font-semibold text-white hover:bg-[#c82027]"
              >
                Delete
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white">
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-[980px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-[#FAF9F6]">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all merchants on page"
                      className="h-[14px] w-[14px] accent-navy"
                    />
                  </th>
                  <Th>Merchant</Th>
                  {visible.category ? <Th>Category</Th> : null}
                  {visible.location ? <Th>City / State</Th> : null}
                  {visible.offers ? <Th>Offers</Th> : null}
                  {visible.redeemed ? <Th>Redeemed</Th> : null}
                  {visible.status ? <Th>Status</Th> : null}
                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((merchant) => {
                  const selected = selectedIds.includes(merchant.id)
                  const muted = merchant.status === 'deleted'
                  return (
                    <tr
                      key={merchant.id}
                      className={[
                        'border-b border-border last:border-b-0',
                        selected ? 'bg-[#F7F9FC]' : 'bg-white hover:bg-[#FAFAF8]',
                        muted ? 'opacity-50' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(merchant.id)}
                          aria-label={`Select ${merchant.businessName}`}
                          className="h-[14px] w-[14px] accent-navy"
                        />
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <button
                          type="button"
                          onClick={() => navigate(`/merchants/${merchant.id}`)}
                          className="flex items-center gap-3 text-left"
                        >
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#E8DFD2] text-[12px] font-bold text-navy/50">
                            {merchant.logoUrl ? (
                              <img src={merchant.logoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              merchant.businessName.charAt(0)
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold text-navy">
                              {merchant.businessName}
                            </span>
                            <span className="mt-0.5 block truncate text-[12px] text-muted">
                              {merchant.merchantCode}
                              {merchant.phone ? ` · ${merchant.phone}` : ''}
                            </span>
                          </span>
                        </button>
                      </td>
                      {visible.category ? (
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {merchant.category}
                        </td>
                      ) : null}
                      {visible.location ? (
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {locationLabel(merchant)}
                        </td>
                      ) : null}
                      {visible.offers ? (
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {merchant.offersCount}{' '}
                          {merchant.offersCount === 1 ? 'offer' : 'offers'}
                        </td>
                      ) : null}
                      {visible.redeemed ? (
                        <td className="px-4 py-3.5 align-middle text-[13px] tabular-nums text-navy">
                          {merchant.redeemedCount > 0
                            ? `${merchant.redeemedCount.toLocaleString('en-US')} redeemed`
                            : '—'}
                        </td>
                      ) : null}
                      {visible.status ? (
                        <td className="px-4 py-3.5 align-middle">
                          <MerchantStatusBadge status={merchant.status} />
                        </td>
                      ) : null}
                      <td className="px-3 py-3.5 align-middle">
                        <RowActionButton
                          label={`Actions for ${merchant.businessName}`}
                          open={openMenuId === merchant.id}
                          onToggle={(el) => toggleMenu(merchant.id, el)}
                        />
                      </td>
                    </tr>
                  )
                })}
                {pageItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        3 +
                        Number(visible.category) +
                        Number(visible.location) +
                        Number(visible.offers) +
                        Number(visible.redeemed) +
                        Number(visible.status)
                      }
                      className="px-4 py-14 text-center text-[13px] text-muted"
                    >
                      {loading ? 'Loading merchants…' : 'No merchants match your filters.'}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-4 py-3.5">
            <p className="text-[12px] text-muted">
              Showing {rangeStart}–{rangeEnd} of {total}
              <span className="mx-1.5 text-border">·</span>
              <button
                type="button"
                onClick={() => {
                  setIncludeDeleted((v) => !v)
                  setPage(1)
                }}
                className={[
                  'font-semibold',
                  includeDeleted ? 'text-navy' : 'text-[#3B6FB6]',
                ].join(' ')}
              >
                Include deleted
              </button>
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

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.type === 'delete'
            ? 'Delete merchant'
            : confirm?.type === 'deactivate'
              ? 'Deactivate merchant'
              : confirm?.type === 'restore'
                ? 'Restore merchant'
                : 'Approve & activate'
        }
        message={
          confirm?.type === 'delete'
            ? `Soft delete “${confirm.merchant.businessName}”?`
            : confirm?.type === 'deactivate'
              ? `Deactivate “${confirm?.merchant.businessName}”?`
              : confirm?.type === 'restore'
                ? `Restore “${confirm?.merchant.businessName}”?`
                : `Approve and activate “${confirm?.merchant.businessName}”?`
        }
        confirmLabel={
          confirm?.type === 'delete'
            ? 'Delete'
            : confirm?.type === 'deactivate'
              ? 'Deactivate'
              : confirm?.type === 'restore'
                ? 'Restore'
                : 'Activate'
        }
        destructive={confirm?.type === 'delete'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void handleConfirm()}
      />

      <ConfirmDialog
        open={bulkConfirm !== null && bulkConfirm !== 'category'}
        title={
          bulkConfirm === 'delete'
            ? 'Delete selected'
            : bulkConfirm === 'deactivate'
              ? 'Deactivate selected'
              : 'Activate selected'
        }
        message={`Apply this action to ${selectedIds.length} selected merchant(s)?`}
        confirmLabel={
          bulkConfirm === 'delete'
            ? 'Delete'
            : bulkConfirm === 'deactivate'
              ? 'Deactivate'
              : 'Activate'
        }
        destructive={bulkConfirm === 'delete'}
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => {
          if (bulkConfirm && bulkConfirm !== 'category') void runBulk(bulkConfirm)
        }}
      />

      {bulkConfirm === 'category' ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-border bg-white p-6"
          >
            <h2 className="text-[18px] font-bold text-navy">Change category</h2>
            <p className="mt-2 text-[14px] text-muted">
              Apply a category to {selectedIds.length} selected merchant(s).
            </p>
            <label className="mt-4 block">
              <span className="text-[12px] font-semibold text-navy">Category</span>
              <select
                value={bulkCategory}
                onChange={(event) => setBulkCategory(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy"
              >
                {MERCHANT_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setBulkConfirm(null)}
                className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg border border-border bg-white px-4 text-[13px] font-semibold text-navy hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleBulkChangeCategory()}
                className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white hover:bg-navy-secondary"
              >
                Change category
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Th({ children }: { children: string }) {
  return (
    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
      {children}
    </th>
  )
}

function FilterPill({
  label,
  value,
  displayValue,
  onChange,
  options,
}: {
  label: string
  value: string
  displayValue?: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  const shown = displayValue ?? options.find((o) => o.value === value)?.label ?? value

  return (
    <label className="relative inline-flex h-10 min-h-[40px] w-full cursor-pointer items-center gap-1 rounded-lg border border-border bg-white pl-3 pr-8 text-[13px] text-navy sm:w-auto">
      <span className="shrink-0 text-muted">{label}:</span>
      <span className="min-w-0 truncate font-semibold">{shown}</span>
      <span className="pointer-events-none absolute right-2.5 text-muted">
        <ChevronDown />
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function BulkBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 min-h-[40px] items-center rounded-md bg-navy-active px-3 text-[12px] font-semibold text-white hover:bg-[#2a5699]"
    >
      {label}
    </button>
  )
}

function PagerButton({
  label,
  onClick,
  disabled = false,
  active = false,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'inline-flex h-10 min-h-[40px] min-w-10 items-center justify-center rounded-md px-2.5 text-[12px] font-semibold',
        active
          ? 'bg-navy text-white'
          : 'border border-border bg-white text-navy hover:bg-page disabled:cursor-not-allowed disabled:opacity-40',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
