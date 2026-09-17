import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ColumnPicker } from '../components/cms/ColumnPicker'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { OfferStatusBadge } from '../components/offers/OfferStatusBadge'
import {
  RowActionButton,
  ViewportAwareMenu,
  type ViewportMenuItem,
} from '../components/ui/ViewportAwareMenu'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  DesktopTableFrame,
  MobileEmptyState,
  MobilePagerFrame,
  MobileRecordCard,
  MobileRecordField,
  MobileRecordFields,
  MobileRecordList,
  MobileRecordTop,
  MobileSelect,
} from '../components/cms/MobileRecordCard'
import { formatDate, ListPager } from '../components/cms/AdminListPrimitives'
import { useAuth } from '../context/AuthContext'
import { useColumnVisibility } from '../hooks/useColumnVisibility'
import {
  OFFER_CATEGORIES,
  OFFER_STATUS_FILTERS,
  OFFER_TYPE_FILTERS,
} from '../data/offers'
import {
  bulkSoftDeleteOffersApi,
  bulkUpdateOfferStatusApi,
  duplicateOfferApi,
  listOfferMerchantsApi,
  listOffersApi,
  restoreOfferApi,
  softDeleteOfferApi,
  updateOfferStatusApi,
  type OfferListResponse,
  type OfferMerchantOption,
} from '../services/offerApi'
import {
  canCreateInModule,
  canDeleteInModule,
  canEditInModule,
} from '../types/auth'
import type { Offer, OfferStatus, OfferType } from '../types/offer'
import { downloadCsv } from '../utils/csv'
import { collectAllPages } from '../utils/paginate'

const PAGE_SIZE = 25

type StatusFilter = OfferStatus | 'all'
type TypeFilter = OfferType | 'all'
type DateFilter = 'any' | '30d' | '90d' | 'year'
type OfferColumn = 'merchant' | 'category' | 'benefit' | 'validity' | 'redemptions' | 'status'

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

export function OffersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const canEdit = canEditInModule(user, 'Offers')
  const canDelete = canDeleteInModule(user, 'Offers')
  const canCreate = canCreateInModule(user, 'Offers')
  const canMutate = canEdit || canDelete
  const [offers, setOffers] = useState<Offer[]>([])
  const [summary, setSummary] = useState<OfferListResponse['summary']>({
    total: 0,
    live: 0,
    scheduled: 0,
    expired: 0,
    usageTotal: 0,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [merchants, setMerchants] = useState<OfferMerchantOption[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [merchant, setMerchant] = useState(() => searchParams.get('merchantId') || 'all')
  const [category, setCategory] = useState(() => searchParams.get('category') || 'all')
  const [offerType, setOfferType] = useState<TypeFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('any')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Offer | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<Offer | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'pause' | 'delete' | null>(null)
  const [exporting, setExporting] = useState(false)
  const { visible, setColumnVisible } = useColumnVisibility<OfferColumn>('ilokal.columns.offers', {
    merchant: true,
    category: true,
    benefit: true,
    validity: true,
    redemptions: true,
    status: true,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const urlMerchant = searchParams.get('merchantId') || 'all'
  const urlCategory = searchParams.get('category') || 'all'
  useEffect(() => {
    setMerchant(urlMerchant)
    setCategory(urlCategory)
    setPage(1)
  }, [urlMerchant, urlCategory])

  useEffect(() => {
    let cancelled = false
    listOfferMerchantsApi()
      .then((data) => {
        if (!cancelled) setMerchants(data)
      })
      .catch(() => {
        if (!cancelled) setMerchants([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadOffers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listOffersApi({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        status,
        merchantId: merchant,
        category,
        offerType,
        date: dateFilter,
        includeDeleted: includeDeleted || status === 'deleted',
      })
      setOffers(data.offers)
      setSummary(data.summary)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load offers')
      setOffers([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status, merchant, category, offerType, dateFilter, includeDeleted])

  useEffect(() => {
    void loadOffers()
  }, [loadOffers])

  const pageItems = offers
  const totalPages = Math.max(1, pagination.totalPages)
  const currentPage = Math.min(page, totalPages)
  const total = pagination.total
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, total)
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((o) => selectedIds.includes(o.id))

  const pageNumbers = useMemo(() => {
    if (totalPages <= 4) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 2) return [1, 2, 3, 4]
    if (currentPage >= totalPages - 1) {
      return [totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
  }, [currentPage, totalPages])

  const activeOffer = pageItems.find((o) => o.id === openMenuId) ?? null
  const menuItems: ViewportMenuItem[] = activeOffer
    ? activeOffer.status === 'deleted'
      ? [
          {
            id: 'view',
            label: 'View offer',
            onClick: () => navigate(`/offers/${activeOffer.id}`),
          },
          ...(canDelete
            ? [
                {
                  id: 'restore',
                  label: 'Restore offer',
                  onClick: () => setConfirmRestore(activeOffer),
                },
              ]
            : []),
        ]
      : [
          {
            id: 'view',
            label: 'View offer',
            onClick: () => navigate(`/offers/${activeOffer.id}`),
          },
          ...(canEdit
            ? [
                {
                  id: 'edit',
                  label: 'Edit offer',
                  onClick: () => navigate(`/offers/${activeOffer.id}/edit`),
                },
                {
                  id: 'pause',
                  label: activeOffer.status === 'paused' ? 'Activate offer' : 'Pause offer',
                  onClick: () => {
                    void (async () => {
                      try {
                        setError(null)
                        await updateOfferStatusApi(
                          activeOffer.id,
                          activeOffer.status === 'paused' ? 'live' : 'paused',
                        )
                        closeMenu()
                        await loadOffers()
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Unable to update offer')
                        closeMenu()
                      }
                    })()
                  },
                },
              ]
            : []),
          ...(canCreate
            ? [
                {
                  id: 'duplicate',
                  label: 'Duplicate offer',
                  onClick: () => {
                    void (async () => {
                      try {
                        setError(null)
                        const copy = await duplicateOfferApi(activeOffer.id)
                        closeMenu()
                        navigate(`/offers/${copy.id}/edit`)
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Unable to duplicate offer')
                        closeMenu()
                      }
                    })()
                  },
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  id: 'delete',
                  label: 'Delete offer',
                  destructive: true,
                  dividerBefore: true,
                  onClick: () => setConfirmDelete(activeOffer),
                },
              ]
            : []),
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
      const pageIds = new Set(pageItems.map((o) => o.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)))
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      pageItems.forEach((o) => next.add(o.id))
      return [...next]
    })
  }

  async function handleExport(): Promise<void> {
    try {
      setError(null)
      setExporting(true)
      const all = await collectAllPages(async (page, pageSize) => {
        const data = await listOffersApi({
          page,
          pageSize,
          search: debouncedSearch,
          status,
          merchantId: merchant,
          category,
          offerType,
          date: dateFilter,
          includeDeleted: includeDeleted || status === 'deleted',
        })
        return { items: data.offers, totalPages: data.pagination.totalPages }
      })
      downloadCsv(
        'offers.csv',
        ['title', 'code', 'merchant', 'category', 'benefit', 'validity', 'status', 'redeemedCount'],
        all.map((offer) => [
          offer.title,
          offer.offerCode,
          offer.merchantName,
          offer.category,
          offer.benefitLabel,
          offer.validityLabel,
          offer.status,
          offer.redeemedCount,
        ]),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export offers')
    } finally {
      setExporting(false)
    }
  }

  async function runBulk(action: 'activate' | 'pause' | 'delete'): Promise<void> {
    try {
      setError(null)
      if (action === 'activate') await bulkUpdateOfferStatusApi(selectedIds, 'live')
      if (action === 'pause') await bulkUpdateOfferStatusApi(selectedIds, 'paused')
      if (action === 'delete') await bulkSoftDeleteOffersApi(selectedIds)
      setSelectedIds([])
      setBulkConfirm(null)
      await loadOffers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update offers')
      setBulkConfirm(null)
    }
  }

  const renderOffersPager = (className?: string) => (
    <ListPager
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      total={total}
      extra={
        <>
          <span className="mx-1.5 text-border">·</span>
          <button
            type="button"
            onClick={() => {
              setIncludeDeleted((v) => !v)
              setPage(1)
            }}
            className={['font-semibold', includeDeleted ? 'text-navy' : 'text-[#3B6FB6]'].join(' ')}
          >
            Include deleted
          </button>
        </>
      }
      currentPage={currentPage}
      totalPages={totalPages}
      pageNumbers={pageNumbers}
      onPrevious={() => setPage((p) => Math.max(1, p - 1))}
      onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      onPage={setPage}
      className={className}
    />
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden md:h-full md:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Offers</h1>
            <p className="mt-0.5 text-[12px] text-muted">
              Manage merchant offers available to iLokal members.
            </p>
            {error ? <p className="mt-1 text-[12px] text-action">{error}</p> : null}
          </div>
          {canCreate ? (
            <Link
              to="/offers/create"
              className="inline-flex h-10 min-h-[40px] w-full items-center justify-center rounded-lg bg-action px-4 text-[13px] font-semibold text-white transition hover:bg-[#c82027] sm:w-auto"
            >
              + New offer
            </Link>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 md:overflow-hidden">
        <div className="mb-4 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Total offers" value={String(summary.total)} />
          <SummaryCard label="Live" value={String(summary.live)} />
          <SummaryCard label="Scheduled" value={String(summary.scheduled)} />
          <SummaryCard label="Expired" value={String(summary.expired)} />
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
                placeholder="Search by offer name or merchant"
                className="h-10 min-h-[40px] w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill
                label="Status"
                value={status}
                onChange={(v) => {
                  setStatus(v as StatusFilter)
                  setPage(1)
                }}
                options={OFFER_STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
              />
              <FilterPill
                label="Merchant"
                value={merchant}
                displayValue={
                  merchant === 'all'
                    ? 'All merchants'
                    : merchants.find((m) => m.id === merchant)?.name ?? 'Selected merchant'
                }
                onChange={(v) => {
                  setMerchant(v)
                  setPage(1)
                }}
                options={[
                  { value: 'all', label: 'All merchants' },
                  ...merchants.map((m) => ({ value: m.id, label: m.name })),
                  ...(merchant !== 'all' && !merchants.some((m) => m.id === merchant)
                    ? [{ value: merchant, label: 'Selected merchant' }]
                    : []),
                ]}
              />
              <FilterPill
                label="Category"
                value={category}
                displayValue={category === 'all' ? 'All categories' : category}
                onChange={(v) => {
                  setCategory(v)
                  setPage(1)
                }}
                options={[
                  { value: 'all', label: 'All categories' },
                  ...OFFER_CATEGORIES.map((c) => ({ value: c, label: c })),
                  ...(category !== 'all' &&
                  !(OFFER_CATEGORIES as readonly string[]).includes(category)
                    ? [{ value: category, label: category }]
                    : []),
                ]}
              />
              <FilterPill
                label="Offer type"
                value={offerType}
                displayValue={
                  OFFER_TYPE_FILTERS.find((t) => t.value === offerType)?.label ?? 'All types'
                }
                onChange={(v) => {
                  setOfferType(v as TypeFilter)
                  setPage(1)
                }}
                options={OFFER_TYPE_FILTERS.map((t) => ({ value: t.value, label: t.label }))}
              />
              <FilterPill
                label="Date"
                value={dateFilter}
                displayValue={
                  dateFilter === 'any'
                    ? 'Any time'
                    : dateFilter === '30d'
                      ? 'Last 30 days'
                      : dateFilter === '90d'
                        ? 'Last 90 days'
                        : 'This year'
                }
                onChange={(v) => {
                  setDateFilter(v as DateFilter)
                  setPage(1)
                }}
                options={[
                  { value: 'any', label: 'Any time' },
                  { value: '30d', label: 'Last 30 days' },
                  { value: '90d', label: 'Last 90 days' },
                  { value: 'year', label: 'This year' },
                ]}
              />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
              className="inline-flex h-10 min-h-[40px] items-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page disabled:opacity-60"
            >
              {exporting ? 'Exporting…' : 'Export'}
            </button>
            <ColumnPicker
              columns={[
                { key: 'merchant', label: 'Merchant' },
                { key: 'category', label: 'Category' },
                { key: 'benefit', label: 'Benefit' },
                { key: 'validity', label: 'Validity' },
                { key: 'redemptions', label: 'Redemptions' },
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
                <button
                  type="button"
                  onClick={() => setBulkConfirm('activate')}
                  className="inline-flex h-10 min-h-[40px] items-center rounded-md bg-navy-active px-3 text-[12px] font-semibold text-white hover:bg-[#2a5699]"
                >
                  Activate
                </button>
                <button
                  type="button"
                  onClick={() => setBulkConfirm('pause')}
                  className="inline-flex h-10 min-h-[40px] items-center rounded-md bg-navy-active px-3 text-[12px] font-semibold text-white hover:bg-[#2a5699]"
                >
                  Pause
                </button>
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

        {loading && pageItems.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <>
            {!loading && pageItems.length === 0 ? (
              <MobileEmptyState>No offers match your filters.</MobileEmptyState>
            ) : null}
            {pageItems.length > 0 ? (
              <MobileRecordList>
                {pageItems.map((offer) => {
                  const selected = selectedIds.includes(offer.id)
                  return (
                    <MobileRecordCard key={offer.id} selected={selected}>
                      <MobileRecordTop
                        select={
                          <MobileSelect
                            checked={selected}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(offer.id)
                                  ? prev.filter((id) => id !== offer.id)
                                  : [...prev, offer.id],
                              )
                            }
                            label={`Select ${offer.title}`}
                          />
                        }
                        title={
                          <button
                            type="button"
                            onClick={() => navigate(`/offers/${offer.id}`)}
                            className="text-left hover:underline"
                          >
                            {offer.title}
                          </button>
                        }
                        subtitle={offer.offerCode}
                        badge={<OfferStatusBadge status={offer.status} />}
                        action={
                          <RowActionButton
                            label={`Actions for ${offer.title}`}
                            open={openMenuId === offer.id}
                            onToggle={(el) => toggleMenu(offer.id, el)}
                          />
                        }
                      />
                      <MobileRecordFields>
                        <MobileRecordField label="Merchant" value={offer.merchantName} />
                        <MobileRecordField label="Category" value={offer.category} />
                        <MobileRecordField label="Offer value" value={offer.benefitLabel} />
                        <MobileRecordField
                          label="Redemptions"
                          value={offer.redeemedCount.toLocaleString('en-US')}
                        />
                        <MobileRecordField label="Start date" value={formatDate(offer.validFrom)} />
                        <MobileRecordField label="End date" value={formatDate(offer.validTo)} />
                      </MobileRecordFields>
                    </MobileRecordCard>
                  )
                })}
              </MobileRecordList>
            ) : null}
            <MobilePagerFrame>{renderOffersPager()}</MobilePagerFrame>
            <DesktopTableFrame footer={renderOffersPager('border-t border-border')}>
              <table className="min-w-[1080px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-[#FAF9F6]">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all offers on page"
                        className="h-[14px] w-[14px] accent-navy"
                      />
                    </th>
                    <Th>Offer</Th>
                    {visible.merchant ? <Th>Merchant</Th> : null}
                    {visible.category ? <Th>Category</Th> : null}
                    {visible.benefit ? <Th>Benefit</Th> : null}
                    {visible.validity ? <Th>Validity</Th> : null}
                    {visible.redemptions ? <Th>Redemptions</Th> : null}
                    {visible.status ? <Th>Status</Th> : null}
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((offer) => {
                    const selected = selectedIds.includes(offer.id)
                    return (
                      <tr
                        key={offer.id}
                        className={[
                          'border-b border-border last:border-b-0',
                          selected ? 'bg-[#F7F9FC]' : 'bg-white hover:bg-[#FAFAF8]',
                        ].join(' ')}
                      >
                        <td className="px-4 py-3.5 align-middle">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(offer.id)
                                  ? prev.filter((id) => id !== offer.id)
                                  : [...prev, offer.id],
                              )
                            }
                            aria-label={`Select ${offer.title}`}
                            className="h-[14px] w-[14px] accent-navy"
                          />
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <button
                            type="button"
                            onClick={() => navigate(`/offers/${offer.id}`)}
                            className="text-left"
                          >
                            <p className="text-[13px] font-semibold text-navy">{offer.title}</p>
                            <p className="mt-0.5 text-[12px] text-muted">{offer.offerCode}</p>
                          </button>
                        </td>
                        {visible.merchant ? (
                          <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                            {offer.merchantName}
                          </td>
                        ) : null}
                        {visible.category ? (
                          <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                            {offer.category}
                          </td>
                        ) : null}
                        {visible.benefit ? (
                          <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                            {offer.benefitLabel}
                          </td>
                        ) : null}
                        {visible.validity ? (
                          <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                            {offer.validityLabel}
                          </td>
                        ) : null}
                        {visible.redemptions ? (
                          <td className="px-4 py-3.5 align-middle text-[13px] tabular-nums text-navy">
                            {offer.redeemedCount.toLocaleString('en-US')} redeemed
                          </td>
                        ) : null}
                        {visible.status ? (
                          <td className="px-4 py-3.5 align-middle">
                            <OfferStatusBadge status={offer.status} />
                          </td>
                        ) : null}
                        <td className="px-3 py-3.5 align-middle">
                          <RowActionButton
                            label={`Actions for ${offer.title}`}
                            open={openMenuId === offer.id}
                            onToggle={(el) => toggleMenu(offer.id, el)}
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
                          Number(visible.merchant) +
                          Number(visible.category) +
                          Number(visible.benefit) +
                          Number(visible.validity) +
                          Number(visible.redemptions) +
                          Number(visible.status)
                        }
                        className="px-4 py-14 text-center text-[13px] text-muted"
                      >
                        No offers match your filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </DesktopTableFrame>
          </>
        )}
      </div>

      <ViewportAwareMenu
        open={Boolean(openMenuId && menuAnchor)}
        anchorEl={menuAnchor}
        items={menuItems}
        onClose={closeMenu}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete offer"
        message={`Delete “${confirmDelete?.title}”?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          void (async () => {
            if (!confirmDelete) return
            try {
              setError(null)
              await softDeleteOfferApi(confirmDelete.id)
              setConfirmDelete(null)
              closeMenu()
              await loadOffers()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to delete offer')
              setConfirmDelete(null)
              closeMenu()
            }
          })()
        }}
      />

      <ConfirmDialog
        open={confirmRestore !== null}
        title="Restore offer"
        message={`Restore “${confirmRestore?.title}”?`}
        confirmLabel="Restore"
        onCancel={() => setConfirmRestore(null)}
        onConfirm={() => {
          void (async () => {
            if (!confirmRestore) return
            try {
              setError(null)
              await restoreOfferApi(confirmRestore.id)
              setConfirmRestore(null)
              closeMenu()
              await loadOffers()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to restore offer')
              setConfirmRestore(null)
              closeMenu()
            }
          })()
        }}
      />

      <ConfirmDialog
        open={bulkConfirm !== null}
        title={
          bulkConfirm === 'delete'
            ? 'Delete selected'
            : bulkConfirm === 'pause'
              ? 'Pause selected'
              : 'Activate selected'
        }
        message={`Apply this action to ${selectedIds.length} selected offer(s)?`}
        confirmLabel={
          bulkConfirm === 'delete' ? 'Delete' : bulkConfirm === 'pause' ? 'Pause' : 'Activate'
        }
        destructive={bulkConfirm === 'delete'}
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => {
          if (bulkConfirm) void runBulk(bulkConfirm)
        }}
      />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-[26px] font-bold tracking-[-0.02em] text-navy">{value}</p>
    </article>
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
      <span className="min-w-0 max-w-none truncate font-semibold sm:max-w-[140px]">{shown}</span>
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
