import { useEffect, useMemo, useState } from 'react'
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
import { SUBSCRIPTION_SUMMARY } from '../data/subscriptions'
import {
  bulkSetSubscriptionStatus,
  getSubscriptions,
  renewSubscription,
  setSubscriptionStatus,
  subscribeSubscriptions,
} from '../services/subscriptionStore'
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

function expiryWithinDays(expiryDate: string, days: number): boolean {
  const expiry = new Date(expiryDate).getTime()
  if (Number.isNaN(expiry)) return false
  const now = Date.now()
  const end = now + days * 24 * 60 * 60 * 1000
  return expiry >= now && expiry <= end
}

export function SubscriptionsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState(getSubscriptions)
  const [search, setSearch] = useState('')
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

  useEffect(() => subscribeSubscriptions(() => setItems(getSubscriptions())), [])

  const filtered = useMemo(() => {
    return items.filter((s) => {
      if (status !== 'all' && s.status !== status) return false
      if (plan !== 'all' && s.plan !== plan) return false
      if (billing !== 'all' && s.billing !== billing) return false
      if (expiry !== 'any') {
        const days = expiry === '7d' ? 7 : expiry === '30d' ? 30 : 90
        if (!expiryWithinDays(s.expiryDate, days)) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const hay = `${s.memberName} ${s.memberEmail} ${s.subscriptionCode} ${s.id}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, status, plan, billing, expiry, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / CMS_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * CMS_PAGE_SIZE,
    currentPage * CMS_PAGE_SIZE,
  )
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * CMS_PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * CMS_PAGE_SIZE, filtered.length)
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
        {
          id: 'renew',
          label: 'Renew',
          onClick: () => {
            renewSubscription(activeItem.id)
            closeMenu()
          },
        },
        {
          id: 'suspend',
          label: 'Suspend',
          onClick: () => setConfirm({ type: 'suspend', item: activeItem }),
        },
        {
          id: 'cancel',
          label: 'Cancel subscription',
          destructive: true,
          dividerBefore: true,
          onClick: () => setConfirm({ type: 'cancel', item: activeItem }),
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

  function handleConfirm(): void {
    if (!confirm) return
    if (confirm.type === 'suspend' || confirm.type === 'cancel') {
      setSubscriptionStatus(confirm.item.id, 'suspended')
    }
    setConfirm(null)
    closeMenu()
  }

  function runBulk(action: 'activate' | 'suspend' | 'cancel'): void {
    if (action === 'activate') bulkSetSubscriptionStatus(selectedIds, 'active')
    if (action === 'suspend' || action === 'cancel') {
      bulkSetSubscriptionStatus(selectedIds, 'suspended')
    }
    setSelectedIds([])
    setBulkConfirm(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
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
          <SummaryCard label="Total subscriptions" value={String(SUBSCRIPTION_SUMMARY.total)} />
          <SummaryCard label="Active" value={String(SUBSCRIPTION_SUMMARY.active)} />
          <SummaryCard label="Expiring soon" value={String(SUBSCRIPTION_SUMMARY.expiringSoon)} />
          <SummaryCard label="Expired" value={String(SUBSCRIPTION_SUMMARY.expired)} />
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
                placeholder="Search by member, email or subscription ID"
                className="h-[38px] w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10"
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

        {selectedIds.length > 0 ? (
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
            <div className="overflow-x-auto">
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
                  {pageItems.map((row) => {
                    const selected = selectedIds.includes(row.id)
                    return (
                      <tr
                        key={row.id}
                        className={[
                          'border-b border-border last:border-b-0',
                          selected ? 'bg-[#F7F9FC]' : 'bg-white hover:bg-[#FAFAF8]',
                          row.status === 'suspended' || row.status === 'expired'
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
                  {pageItems.length === 0 ? (
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
        open={confirm?.type === 'suspend'}
        title="Suspend subscription?"
        message={
          confirm
            ? `Suspend the subscription for ${confirm.item.memberName}? Benefits will pause until resumed.`
            : ''
        }
        confirmLabel="Suspend"
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={confirm?.type === 'cancel'}
        title="Cancel subscription?"
        message={
          confirm
            ? `Cancel the subscription for ${confirm.item.memberName}? This will mark it as suspended.`
            : ''
        }
        confirmLabel="Cancel subscription"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={bulkConfirm === 'activate'}
        title="Bulk activate"
        message={`Activate ${selectedIds.length} subscriptions? Frontend only.`}
        confirmLabel="Activate"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('activate')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'suspend'}
        title="Bulk suspend"
        message={`Suspend ${selectedIds.length} subscriptions? Frontend only.`}
        confirmLabel="Suspend"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('suspend')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'cancel'}
        title="Bulk cancel"
        message={`Cancel ${selectedIds.length} subscriptions? Frontend only.`}
        confirmLabel="Cancel"
        destructive
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('cancel')}
      />
    </div>
  )
}
