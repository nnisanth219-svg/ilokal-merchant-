import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { OfferStatusBadge } from '../components/offers/OfferStatusBadge'
import {
  RowActionButton,
  ViewportAwareMenu,
  type ViewportMenuItem,
} from '../components/ui/ViewportAwareMenu'
import {
  OFFER_CATEGORIES,
  OFFER_STATUS_FILTERS,
  OFFER_TYPE_FILTERS,
  offerSummaryStats,
} from '../data/offers'
import {
  bulkDeleteOffers,
  bulkSetOfferStatus,
  deleteOffer,
  duplicateOffer,
  getOffers,
  setOfferStatus,
  subscribeOffers,
} from '../services/offerStore'
import type { Offer, OfferStatus, OfferType } from '../types/offer'

const PAGE_SIZE = 25

type StatusFilter = OfferStatus | 'all'
type TypeFilter = OfferType | 'all'
type DateFilter = 'any' | '30d' | '90d' | 'year'

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
  const [offers, setOffers] = useState(getOffers)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [merchant, setMerchant] = useState('all')
  const [category, setCategory] = useState('all')
  const [offerType, setOfferType] = useState<TypeFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('any')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Offer | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'pause' | 'delete' | null>(null)

  useEffect(() => subscribeOffers(() => setOffers(getOffers())), [])

  const merchants = useMemo(() => {
    const map = new Map<string, string>()
    offers.forEach((o) => map.set(o.merchantId, o.merchantName))
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [offers])

  const filtered = useMemo(() => {
    return offers.filter((o) => {
      if (status !== 'all' && o.status !== status) return false
      if (merchant !== 'all' && o.merchantId !== merchant) return false
      if (category !== 'all' && o.category !== category) return false
      if (offerType !== 'all' && o.offerType !== offerType) return false
      if (dateFilter !== 'any') {
        const created = new Date(o.createdAt).getTime()
        const days = dateFilter === '30d' ? 30 : dateFilter === '90d' ? 90 : 365
        if (Date.now() - created > days * 24 * 60 * 60 * 1000) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const hay = `${o.title} ${o.merchantName} ${o.offerCode}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [offers, status, merchant, category, offerType, dateFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length)
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
    ? [
        {
          id: 'view',
          label: 'View offer',
          onClick: () => navigate(`/offers/${activeOffer.id}`),
        },
        {
          id: 'edit',
          label: 'Edit offer',
          onClick: () => navigate(`/offers/${activeOffer.id}/edit`),
        },
        {
          id: 'pause',
          label: activeOffer.status === 'paused' ? 'Activate offer' : 'Pause offer',
          onClick: () =>
            setOfferStatus(
              activeOffer.id,
              activeOffer.status === 'paused' ? 'live' : 'paused',
            ),
        },
        {
          id: 'duplicate',
          label: 'Duplicate offer',
          onClick: () => {
            const copy = duplicateOffer(activeOffer.id)
            if (copy) navigate(`/offers/${copy.id}/edit`)
          },
        },
        {
          id: 'delete',
          label: 'Delete offer',
          destructive: true,
          dividerBefore: true,
          onClick: () => setConfirmDelete(activeOffer),
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

  function runBulk(action: 'activate' | 'pause' | 'delete'): void {
    if (action === 'activate') bulkSetOfferStatus(selectedIds, 'live')
    if (action === 'pause') bulkSetOfferStatus(selectedIds, 'paused')
    if (action === 'delete') bulkDeleteOffers(selectedIds)
    setSelectedIds([])
    setBulkConfirm(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Offers</h1>
            <p className="mt-0.5 text-[12px] text-muted">
              Manage merchant offers available to iLokal members.
            </p>
          </div>
          <Link
            to="/offers/create"
            className="inline-flex h-[38px] min-h-[38px] w-full items-center justify-center rounded-lg bg-action px-4 text-[13px] font-semibold text-white transition hover:bg-[#c82027] sm:w-auto"
          >
            + New offer
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Total offers" value={String(offerSummaryStats.total)} />
          <SummaryCard label="Live" value={String(offerSummaryStats.live)} />
          <SummaryCard label="Scheduled" value={String(offerSummaryStats.scheduled)} />
          <SummaryCard label="Expired" value={String(offerSummaryStats.expired)} />
        </div>

        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
                className="h-[38px] w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10"
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
                    : merchants.find((m) => m.id === merchant)?.name ?? 'All merchants'
                }
                onChange={(v) => {
                  setMerchant(v)
                  setPage(1)
                }}
                options={[
                  { value: 'all', label: 'All merchants' },
                  ...merchants.map((m) => ({ value: m.id, label: m.name })),
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
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-[38px] items-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page"
            >
              Export
            </button>
            <button
              type="button"
              className="inline-flex h-[38px] items-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page"
            >
              Columns
            </button>
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-navy px-4 py-3">
            <span className="text-[13px] font-semibold text-white">
              {selectedIds.length} selected
            </span>
            <span className="text-[12px] font-medium text-white/55">Bulk:</span>
            <button
              type="button"
              onClick={() => setBulkConfirm('activate')}
              className="inline-flex h-8 items-center rounded-md bg-navy-active px-3 text-[12px] font-semibold text-white hover:bg-[#2a5699]"
            >
              Activate
            </button>
            <button
              type="button"
              onClick={() => setBulkConfirm('pause')}
              className="inline-flex h-8 items-center rounded-md bg-navy-active px-3 text-[12px] font-semibold text-white hover:bg-[#2a5699]"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={() => setBulkConfirm('delete')}
              className="inline-flex h-8 items-center rounded-md bg-action px-3 text-[12px] font-semibold text-white hover:bg-[#c82027]"
            >
              Delete
            </button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="overflow-x-auto">
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
                  <Th>Merchant</Th>
                  <Th>Category</Th>
                  <Th>Benefit</Th>
                  <Th>Validity</Th>
                  <Th>Redemptions</Th>
                  <Th>Status</Th>
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
                      <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                        {offer.merchantName}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                        {offer.category}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                        {offer.benefitLabel}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                        {offer.validityLabel}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-[13px] tabular-nums text-navy">
                        {offer.redeemedCount.toLocaleString('en-US')} redeemed
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <OfferStatusBadge status={offer.status} />
                      </td>
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
                    <td colSpan={9} className="px-4 py-14 text-center text-[13px] text-muted">
                      No offers match your filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-4 py-3.5">
            <p className="text-[12px] text-muted">
              Showing {rangeStart}–{rangeEnd} of {filtered.length}
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
        open={confirmDelete !== null}
        title="Delete offer"
        message={`Delete “${confirmDelete?.title}”? Frontend only.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteOffer(confirmDelete.id)
          setConfirmDelete(null)
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
        message={`Apply this action to ${selectedIds.length} selected offer(s)? Frontend only.`}
        confirmLabel={
          bulkConfirm === 'delete' ? 'Delete' : bulkConfirm === 'pause' ? 'Pause' : 'Activate'
        }
        destructive={bulkConfirm === 'delete'}
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => {
          if (bulkConfirm) runBulk(bulkConfirm)
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
    <label className="relative inline-flex h-[38px] min-h-[38px] w-full cursor-pointer items-center gap-1 rounded-lg border border-border bg-white pl-3 pr-8 text-[13px] text-navy sm:w-auto">
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
        'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2.5 text-[12px] font-semibold',
        active
          ? 'bg-navy text-white'
          : 'border border-border bg-white text-navy hover:bg-page disabled:cursor-not-allowed disabled:opacity-40',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
