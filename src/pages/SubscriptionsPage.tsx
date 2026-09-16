import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { SubscriptionStatusBadge } from '../components/subscriptions/SubscriptionStatusBadge'
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
import { useAuth } from '../context/AuthContext'
import { canEditInModule } from '../types/auth'
import {
  bulkUpdateSubscriptionStatusApi,
  listSubscriptionsApi,
  renewSubscriptionApi,
  updateSubscriptionStatusApi,
  type SubscriptionListResponse,
} from '../services/subscriptionApi'
import {
  SUBSCRIPTION_PLAN_FILTERS,
  SUBSCRIPTION_STATUS_FILTERS,
  type BillingCycle,
  type Subscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from '../types/subscription'

type StatusFilter = SubscriptionStatus | 'all'
type PlanFilter = SubscriptionPlan | 'all'
type BillingFilter = BillingCycle | 'all'
type ExpiryFilter = 'any' | '7d' | '30d' | '90d'

const BILLING_FILTERS: { value: BillingFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Annual', label: 'Annual' },
]

const EXPIRY_FILTERS: { value: ExpiryFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: '7d', label: 'Next 7 days' },
  { value: '30d', label: 'Next 30 days' },
  { value: '90d', label: 'Next 90 days' },
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function SubscriptionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = canEditInModule(user, 'Subscriptions')
  const [items, setItems] = useState<Subscription[]>([])
  const [summary, setSummary] = useState<SubscriptionListResponse['summary']>({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
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
  const [status, setStatus] = useState<StatusFilter>('all')
  const [plan, setPlan] = useState<PlanFilter>('all')
  const [billing, setBilling] = useState<BillingFilter>('all')
  const [expiry, setExpiry] = useState<ExpiryFilter>('any')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [confirm, setConfirm] = useState<{
    type: 'suspend' | 'cancel'
    item: Subscription
  } | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'suspend' | 'cancel' | null>(
    null,
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadSubscriptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listSubscriptionsApi({
        page,
        pageSize: CMS_PAGE_SIZE,
        search: debouncedSearch,
        status,
        plan,
        billing,
        expiry,
      })
      setItems(data.subscriptions)
      setSummary(data.summary)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load subscriptions')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status, plan, billing, expiry])

  useEffect(() => {
    void loadSubscriptions()
  }, [loadSubscriptions])

  const pageItems = items
  const totalPages = Math.max(1, pagination.totalPages)
  const currentPage = Math.min(page, totalPages)
  const total = pagination.total
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * CMS_PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * CMS_PAGE_SIZE, total)
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((s) => selectedIds.includes(s.id))
  const pageNumbers = useMemo(
    () => pageWindow(currentPage, totalPages),
    [currentPage, totalPages],
  )

  const activeItem = pageItems.find((s) => s.id === openMenuId) ?? null

  const menuItems: ViewportMenuItem[] = activeItem
    ? [
        {
          id: 'view',
          label: 'View subscription',
          onClick: () => navigate(`/subscriptions/${activeItem.id}`),
        },
        {
          id: 'member',
          label: 'View member',
          onClick: () => navigate(`/members/${activeItem.memberId}`),
        },
        {
          id: 'payments',
          label: 'View payment history',
          onClick: () => navigate(`/subscriptions/${activeItem.id}`),
        },
        ...(canEdit
          ? [
              {
                id: 'renew',
                label: 'Renew',
                onClick: () => {
                  void (async () => {
                    try {
                      setError(null)
                      await renewSubscriptionApi(activeItem.id)
                      closeMenu()
                      await loadSubscriptions()
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Unable to renew subscription')
                      closeMenu()
                    }
                  })()
                },
              },
              {
                id: 'suspend',
                label: 'Suspend',
                onClick: () => setConfirm({ type: 'suspend', item: activeItem }),
              },
              ...(activeItem.status === 'cancelled'
                ? []
                : [
                    {
                      id: 'cancel',
                      label: 'Cancel subscription',
                      destructive: true,
                      dividerBefore: true,
                      onClick: () => setConfirm({ type: 'cancel', item: activeItem }),
                    },
                  ]),
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
      const pageIds = new Set(pageItems.map((s) => s.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)))
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      pageItems.forEach((s) => next.add(s.id))
      return [...next]
    })
  }

  function toggleSelect(id: string): void {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleConfirm(): Promise<void> {
    if (!confirm) return
    try {
      setError(null)
      if (confirm.type === 'suspend') {
        await updateSubscriptionStatusApi(confirm.item.id, 'suspended')
      }
      if (confirm.type === 'cancel') {
        await updateSubscriptionStatusApi(confirm.item.id, 'cancelled')
      }
      setConfirm(null)
      closeMenu()
      await loadSubscriptions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update subscription')
      setConfirm(null)
      closeMenu()
    }
  }

  async function runBulk(action: 'activate' | 'suspend' | 'cancel'): Promise<void> {
    try {
      setError(null)
      if (action === 'activate') await bulkUpdateSubscriptionStatusApi(selectedIds, 'active')
      if (action === 'suspend') await bulkUpdateSubscriptionStatusApi(selectedIds, 'suspended')
      if (action === 'cancel') await bulkUpdateSubscriptionStatusApi(selectedIds, 'cancelled')
      setSelectedIds([])
      setBulkConfirm(null)
      await loadSubscriptions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update subscriptions')
      setBulkConfirm(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Subscriptions</h1>
          <p className="mt-0.5 text-[12px] text-muted">
            Manage member subscription plans, status, expiry and payment history.
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Total subscriptions" value={String(summary.total)} />
          <SummaryCard label="Active" value={String(summary.active)} />
          <SummaryCard label="Expiring soon" value={String(summary.expiringSoon)} />
          <SummaryCard label="Expired" value={String(summary.expired)} />
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
                placeholder="Search by member, email or subscription ID"
                className="h-10 min-h-[40px] w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                options={SUBSCRIPTION_STATUS_FILTERS.map((f) => ({
                  value: f.value,
                  label: f.label,
                }))}
              />
              <FilterPill
                label="Plan"
                value={plan}
                displayValue={plan === 'all' ? 'All' : plan}
                onChange={(v) => {
                  setPlan(v as PlanFilter)
                  setPage(1)
                }}
                options={SUBSCRIPTION_PLAN_FILTERS.map((f) => ({
                  value: f.value,
                  label: f.label,
                }))}
              />
              <FilterPill
                label="Billing"
                value={billing}
                displayValue={billing === 'all' ? 'All' : billing}
                onChange={(v) => {
                  setBilling(v as BillingFilter)
                  setPage(1)
                }}
                options={BILLING_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
              />
              <FilterPill
                label="Expiry"
                value={expiry}
                displayValue={
                  EXPIRY_FILTERS.find((f) => f.value === expiry)?.label ?? 'Any time'
                }
                onChange={(v) => {
                  setExpiry(v as ExpiryFilter)
                  setPage(1)
                }}
                options={EXPIRY_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
              />
            </div>
          </div>
        </div>

        {selectedIds.length > 0 && canEdit ? (
          <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3 rounded-xl bg-navy px-4 py-3">
            <span className="text-[13px] font-semibold text-white">
              {selectedIds.length} selected
            </span>
            <span className="text-[12px] font-medium text-white/55">Bulk:</span>
            <BulkBtn label="Activate" onClick={() => setBulkConfirm('activate')} />
            <BulkBtn label="Suspend" onClick={() => setBulkConfirm('suspend')} />
            <button
              type="button"
              onClick={() => setBulkConfirm('cancel')}
              className="inline-flex h-10 min-h-[40px] items-center rounded-md bg-action px-3 text-[12px] font-semibold text-white hover:bg-[#c82027]"
            >
              Cancel
            </button>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white">
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="min-w-[1100px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-[#FAF9F6]">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all subscriptions on page"
                        className="h-[14px] w-[14px] accent-navy"
                      />
                    </th>
                    <Th>Member</Th>
                    <Th>Subscription ID</Th>
                    <Th>Plan</Th>
                    <Th>Billing</Th>
                    <Th>Start date</Th>
                    <Th>Expiry date</Th>
                    <Th>Status</Th>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading && pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center text-[13px] text-muted">
                        Loading subscriptions…
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
                          row.status === 'suspended' ||
                          row.status === 'expired' ||
                          row.status === 'cancelled'
                            ? 'opacity-70'
                            : '',
                        ].join(' ')}
                      >
                        <td className="px-4 py-3.5 align-middle">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(row.id)}
                            aria-label={`Select ${row.subscriptionCode}`}
                            className="h-[14px] w-[14px] accent-navy"
                          />
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <button
                            type="button"
                            onClick={() => navigate(`/subscriptions/${row.id}`)}
                            className="flex items-center gap-3 text-left"
                          >
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8DFD2] text-[12px] font-bold text-navy/60">
                              {initials(row.memberName)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-semibold text-navy">
                                {row.memberName}
                              </span>
                              <span className="mt-0.5 block truncate text-[12px] text-muted">
                                {row.memberEmail}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] tabular-nums text-navy">
                          {row.subscriptionCode}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {row.plan}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {row.billing}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {formatDate(row.startDate)}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {formatDate(row.expiryDate)}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <SubscriptionStatusBadge status={row.status} />
                        </td>
                        <td className="px-3 py-3.5 align-middle">
                          <RowActionButton
                            label={`Actions for ${row.subscriptionCode}`}
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
                        No subscriptions match your filters.
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

      <ConfirmDialog
        open={confirm?.type === 'suspend'}
        title="Suspend subscription?"
        message={
          confirm
            ? `Suspend the subscription for ${confirm.item.memberName}? Benefits will pause until resumed.`
            : ''
        }
        confirmLabel="Suspend"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void handleConfirm()}
      />
      <ConfirmDialog
        open={confirm?.type === 'cancel'}
        title="Cancel subscription?"
        message={
          confirm
            ? `Cancel the subscription for ${confirm.item.memberName}? This will mark it as cancelled.`
            : ''
        }
        confirmLabel="Cancel subscription"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => void handleConfirm()}
      />
      <ConfirmDialog
        open={bulkConfirm === 'activate'}
        title="Bulk activate"
        message={`Activate ${selectedIds.length} subscriptions?`}
        confirmLabel="Activate"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => void runBulk('activate')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'suspend'}
        title="Bulk suspend"
        message={`Suspend ${selectedIds.length} subscriptions?`}
        confirmLabel="Suspend"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => void runBulk('suspend')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'cancel'}
        title="Bulk cancel"
        message={`Cancel ${selectedIds.length} subscriptions?`}
        confirmLabel="Cancel"
        destructive
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => void runBulk('cancel')}
      />
    </div>
  )
}
