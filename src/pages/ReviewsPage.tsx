import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { ReviewStatusBadge } from '../components/reviews/ReviewStatusBadge'
import {
  BulkBtn,
  CMS_PAGE_SIZE,
  FilterPill,
  formatDate,
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
import { REVIEW_SUMMARY } from '../data/reviews'
import {
  bulkDeleteReviews,
  bulkSetReviewStatus,
  deleteReview,
  getReviews,
  setReviewStatus,
  subscribeReviews,
} from '../services/reviewStore'
import {
  REVIEW_RATING_FILTERS,
  REVIEW_STATUS_FILTERS,
  type ReviewItem,
  type ReviewStatus,
} from '../types/review'

type StatusFilter = ReviewStatus | 'all'
type DateFilter = 'any' | '7d' | '30d' | '90d'

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

function stars(rating: number): string {
  const safe = Math.max(0, Math.min(5, Math.round(rating)))
  return `${'★'.repeat(safe)}${'☆'.repeat(5 - safe)}`
}

function withinLastDays(iso: string, days: number): boolean {
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return false
  return Date.now() - ts <= days * 24 * 60 * 60 * 1000
}

export function ReviewsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState(getReviews)
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState('all')
  const [merchant, setMerchant] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('any')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ReviewItem | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState<'reviewed' | 'hide' | 'delete' | null>(null)

  useEffect(() => subscribeReviews(() => setItems(getReviews())), [])

  const merchantOptions = useMemo(() => {
    const map = new Map<string, string>()
    items.forEach((r) => map.set(r.merchantId, r.merchantName))
    return [...map.entries()].map(([value, label]) => ({ value, label }))
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (rating !== 'all' && String(r.rating) !== rating) return false
      if (merchant !== 'all' && r.merchantId !== merchant) return false
      if (status !== 'all' && r.status !== status) return false
      if (dateFilter !== 'any') {
        const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90
        if (!withinLastDays(r.submittedAt, days)) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const hay = `${r.memberName} ${r.merchantName} ${r.text} ${r.id}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, rating, merchant, status, dateFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / CMS_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * CMS_PAGE_SIZE,
    currentPage * CMS_PAGE_SIZE,
  )
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * CMS_PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * CMS_PAGE_SIZE, filtered.length)
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
          label: 'View review',
          onClick: () => navigate(`/reviews/${activeItem.id}`),
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
          id: 'reviewed',
          label: 'Mark as reviewed',
          onClick: () => {
            setReviewStatus(activeItem.id, 'published')
            closeMenu()
          },
        },
        {
          id: 'hide',
          label: 'Hide review',
          onClick: () => {
            setReviewStatus(activeItem.id, 'hidden')
            closeMenu()
          },
        },
        {
          id: 'delete',
          label: 'Delete review',
          destructive: true,
          dividerBefore: true,
          onClick: () => setConfirmDelete(activeItem),
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
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      pageItems.forEach((r) => next.add(r.id))
      return [...next]
    })
  }

  function toggleSelect(id: string): void {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function runBulk(action: 'reviewed' | 'hide' | 'delete'): void {
    if (action === 'reviewed') bulkSetReviewStatus(selectedIds, 'published')
    if (action === 'hide') bulkSetReviewStatus(selectedIds, 'hidden')
    if (action === 'delete') bulkDeleteReviews(selectedIds)
    setSelectedIds([])
    setBulkConfirm(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Reviews</h1>
          <p className="mt-0.5 text-[12px] text-muted">
            Review member feedback, ratings and merchant reputation.
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Total reviews" value={String(REVIEW_SUMMARY.total)} />
          <SummaryCard label="Average rating" value={REVIEW_SUMMARY.averageRating} />
          <SummaryCard label="5-star reviews" value={String(REVIEW_SUMMARY.fiveStar)} />
          <SummaryCard label="Needs attention" value={String(REVIEW_SUMMARY.needsAttention)} />
        </div>

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
                placeholder="Search by member, merchant or review text"
                className="h-[38px] w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill
                label="Rating"
                value={rating}
                displayValue={
                  REVIEW_RATING_FILTERS.find((f) => f.value === rating)?.label ?? 'All'
                }
                onChange={(v) => {
                  setRating(v)
                  setPage(1)
                }}
                options={REVIEW_RATING_FILTERS.map((f) => ({
                  value: f.value,
                  label: f.label,
                }))}
              />
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
                options={[{ value: 'all', label: 'All' }, ...merchantOptions]}
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
                options={REVIEW_STATUS_FILTERS.map((f) => ({
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
            <BulkBtn label="Mark as reviewed" onClick={() => setBulkConfirm('reviewed')} />
            <BulkBtn label="Hide" onClick={() => setBulkConfirm('hide')} />
            <button
              type="button"
              onClick={() => setBulkConfirm('delete')}
              className="inline-flex h-10 min-h-[40px] items-center rounded-md bg-action px-3 text-[12px] font-semibold text-white hover:bg-[#c82027]"
            >
              Delete
            </button>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white">
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-[#FAF9F6]">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all reviews on page"
                        className="h-[14px] w-[14px] accent-navy"
                      />
                    </th>
                    <Th>Member</Th>
                    <Th>Merchant</Th>
                    <Th>Rating</Th>
                    <Th>Review</Th>
                    <Th>Submitted</Th>
                    <Th>Status</Th>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((row) => {
                    const selected = selectedIds.includes(row.id)
                    return (
                      <tr
                        key={row.id}
                        className={[
                          'border-b border-border last:border-b-0',
                          selected ? 'bg-[#F7F9FC]' : 'bg-white hover:bg-[#FAFAF8]',
                          row.status === 'hidden' ? 'opacity-70' : '',
                        ].join(' ')}
                      >
                        <td className="px-4 py-3.5 align-middle">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(row.id)}
                            aria-label={`Select review by ${row.memberName}`}
                            className="h-[14px] w-[14px] accent-navy"
                          />
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] font-semibold text-navy">
                          <button
                            type="button"
                            onClick={() => navigate(`/reviews/${row.id}`)}
                            className="hover:underline"
                          >
                            {row.memberName}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {row.merchantName}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-gold">
                          {stars(row.rating)}
                        </td>
                        <td className="max-w-[280px] px-4 py-3.5 align-middle text-[13px] text-navy">
                          <span className="line-clamp-2">{row.text}</span>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {formatDate(row.submittedAt)}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <ReviewStatusBadge status={row.status} />
                        </td>
                        <td className="px-3 py-3.5 align-middle">
                          <RowActionButton
                            label={`Actions for review by ${row.memberName}`}
                            open={openMenuId === row.id}
                            onToggle={(el) => toggleMenu(row.id, el)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center text-[13px] text-muted">
                        No reviews match your filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
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
        open={Boolean(confirmDelete)}
        title="Delete review?"
        message={
          confirmDelete
            ? `Permanently remove the review from ${confirmDelete.memberName}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete review"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteReview(confirmDelete.id)
          setConfirmDelete(null)
          closeMenu()
        }}
      />
      <ConfirmDialog
        open={bulkConfirm === 'reviewed'}
        title="Mark as reviewed"
        message={`Mark ${selectedIds.length} reviews as published? Frontend only.`}
        confirmLabel="Mark as reviewed"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('reviewed')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'hide'}
        title="Hide reviews"
        message={`Hide ${selectedIds.length} reviews? Frontend only.`}
        confirmLabel="Hide"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('hide')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'delete'}
        title="Bulk delete"
        message={`Delete ${selectedIds.length} reviews? Frontend only.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('delete')}
      />
    </div>
  )
}
