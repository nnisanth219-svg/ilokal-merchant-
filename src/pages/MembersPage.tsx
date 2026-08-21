import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { MemberStatusBadge } from '../components/members/MemberStatusBadge'
import {
  RowActionButton,
  ViewportAwareMenu,
  type ViewportMenuItem,
} from '../components/ui/ViewportAwareMenu'
import { MEMBER_LIST_DISPLAY } from '../data/members'
import {
  MEMBER_PLAN_FILTERS,
  MEMBER_STATUS_FILTERS,
  type JoinedFilter,
  type Member,
  type MembershipPlan,
  type MemberStatus,
} from '../types/member'
import {
  bulkSetMemberStatus,
  bulkSoftDeleteMembers,
  getMembers,
  setMemberStatus,
  softDeleteMember,
  subscribeMembers,
} from '../services/memberStore'

const PAGE_SIZE = 25

type StatusFilter = MemberStatus | 'all'
type PlanFilter = MembershipPlan | 'all'

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function MembersPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState(getMembers)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [plan, setPlan] = useState<PlanFilter>('all')
  const [joined, setJoined] = useState<JoinedFilter>('any')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [confirm, setConfirm] = useState<{
    type: 'deactivate' | 'delete'
    member: Member
  } | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'deactivate' | 'delete' | null>(
    null,
  )

  useEffect(() => subscribeMembers(() => setMembers(getMembers())), [])

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (status !== 'all' && m.status !== status) return false
      if (plan !== 'all' && m.plan !== plan) return false
      if (joined !== 'any') {
        const created = new Date(m.joinedAt).getTime()
        const days = joined === '7d' ? 7 : joined === '30d' ? 30 : 90
        if (Date.now() - created > days * 24 * 60 * 60 * 1000) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const hay = `${m.fullName} ${m.email} ${m.phone} ${m.memberCode}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [members, status, plan, joined, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length)
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((m) => selectedIds.includes(m.id))

  const pageNumbers = useMemo(() => {
    if (totalPages <= 4) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 2) return [1, 2, 3, 4]
    if (currentPage >= totalPages - 1) {
      return [totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
  }, [currentPage, totalPages])

  const activeMember = pageItems.find((m) => m.id === openMenuId) ?? null

  const menuItems: ViewportMenuItem[] = activeMember
    ? [
        {
          id: 'view',
          label: 'View details',
          onClick: () => navigate(`/members/${activeMember.id}`),
        },
        {
          id: 'deactivate',
          label: 'Deactivate',
          onClick: () => setConfirm({ type: 'deactivate', member: activeMember }),
        },
        {
          id: 'delete',
          label: 'Delete',
          destructive: true,
          dividerBefore: true,
          onClick: () => setConfirm({ type: 'delete', member: activeMember }),
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

  function handleConfirm(): void {
    if (!confirm) return
    if (confirm.type === 'deactivate') setMemberStatus(confirm.member.id, 'inactive')
    if (confirm.type === 'delete') softDeleteMember(confirm.member.id)
    setConfirm(null)
    closeMenu()
  }

  function runBulk(action: 'activate' | 'deactivate' | 'delete'): void {
    if (action === 'activate') bulkSetMemberStatus(selectedIds, 'active')
    if (action === 'deactivate') bulkSetMemberStatus(selectedIds, 'inactive')
    if (action === 'delete') bulkSoftDeleteMembers(selectedIds)
    setSelectedIds([])
    setBulkConfirm(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Members</h1>
            <p className="mt-0.5 text-[12px] text-muted">
              Manage app users, membership status, subscriptions and member activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-[38px] min-h-[38px] items-center rounded-lg border border-border bg-white px-4 text-[13px] font-semibold text-navy transition hover:bg-page"
            >
              Export CSV
            </button>
            <button
              type="button"
              className="inline-flex h-[38px] min-h-[38px] items-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white transition hover:bg-navy-secondary"
            >
              Send broadcast
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 shrink-0">
          <p className="text-[15px] font-semibold text-navy">
            Members · <span className="text-muted">{MEMBER_LIST_DISPLAY.totalLabel} total</span>
          </p>
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
                placeholder="Search by name, email, phone or member ID"
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
                options={MEMBER_STATUS_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
              />
              <FilterPill
                label="Plan"
                value={plan}
                displayValue={plan === 'all' ? 'All' : plan}
                onChange={(v) => {
                  setPlan(v as PlanFilter)
                  setPage(1)
                }}
                options={MEMBER_PLAN_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
              />
              <FilterPill
                label="Joined"
                value={joined}
                displayValue={
                  joined === 'any'
                    ? 'Any time'
                    : joined === '7d'
                      ? 'Last 7 days'
                      : joined === '30d'
                        ? 'Last 30 days'
                        : 'Last 90 days'
                }
                onChange={(v) => {
                  setJoined(v as JoinedFilter)
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
        </div>

        {selectedIds.length > 0 ? (
          <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3 rounded-xl bg-navy px-4 py-3">
            <span className="text-[13px] font-semibold text-white">
              {selectedIds.length} selected
            </span>
            <span className="text-[12px] font-medium text-white/55">Bulk:</span>
            <BulkBtn label="Activate" onClick={() => setBulkConfirm('activate')} />
            <BulkBtn label="Deactivate" onClick={() => setBulkConfirm('deactivate')} />
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
                        aria-label="Select all members on page"
                        className="h-[14px] w-[14px] accent-navy"
                      />
                    </th>
                    <Th>Member</Th>
                    <Th>Member ID</Th>
                    <Th>Contact</Th>
                    <Th>Membership</Th>
                    <Th>Plan</Th>
                    <Th>Joined</Th>
                    <Th>Status</Th>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((member) => {
                    const selected = selectedIds.includes(member.id)
                    return (
                      <tr
                        key={member.id}
                        className={[
                          'border-b border-border last:border-b-0',
                          selected ? 'bg-[#F7F9FC]' : 'bg-white hover:bg-[#FAFAF8]',
                          member.status === 'inactive' ? 'opacity-70' : '',
                        ].join(' ')}
                      >
                        <td className="px-4 py-3.5 align-middle">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(member.id)}
                            aria-label={`Select ${member.fullName}`}
                            className="h-[14px] w-[14px] accent-navy"
                          />
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <button
                            type="button"
                            onClick={() => navigate(`/members/${member.id}`)}
                            className="flex items-center gap-3 text-left"
                          >
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8DFD2] text-[12px] font-bold text-navy/60">
                              {initials(member.fullName)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-semibold text-navy">
                                {member.fullName}
                              </span>
                              <span className="mt-0.5 block truncate text-[12px] text-muted">
                                {member.city}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] tabular-nums text-navy">
                          {member.memberCode}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <p className="text-[13px] text-navy">{member.phone}</p>
                          <p className="mt-0.5 truncate text-[12px] text-muted">{member.email}</p>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {member.planLabel}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {formatDate(member.joinedAt)}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <MemberStatusBadge status={member.status} />
                        </td>
                        <td className="px-3 py-3.5 align-middle">
                          <RowActionButton
                            label={`Actions for ${member.fullName}`}
                            open={openMenuId === member.id}
                            onToggle={(el) => toggleMenu(member.id, el)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center text-[13px] text-muted">
                        No members match your filters.
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
        open={confirm?.type === 'deactivate'}
        title="Deactivate member?"
        message={
          confirm
            ? `This member will no longer be able to use active membership benefits. Deactivate ${confirm.member.fullName}?`
            : ''
        }
        confirmLabel="Deactivate"
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={confirm?.type === 'delete'}
        title="Delete member?"
        message={
          confirm
            ? `This action will remove the member from the active member list. Delete ${confirm.member.fullName}?`
            : ''
        }
        confirmLabel="Delete member"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={bulkConfirm === 'activate'}
        title="Bulk activate"
        message={`Activate ${selectedIds.length} members? Frontend only.`}
        confirmLabel="Activate"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('activate')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'deactivate'}
        title="Bulk deactivate"
        message={`Deactivate ${selectedIds.length} members? Frontend only.`}
        confirmLabel="Deactivate"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('deactivate')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'delete'}
        title="Bulk delete"
        message={`Remove ${selectedIds.length} members from the active list? Frontend only.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('delete')}
      />
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
  options,
  onChange,
}: {
  label: string
  value: string
  displayValue?: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="relative inline-flex h-[38px] min-h-[38px] items-center gap-1.5 rounded-lg border border-border bg-white pl-3 pr-2 text-[13px] text-navy">
      <span className="font-medium text-muted">{label}</span>
      <span className="font-semibold">{displayValue ?? value}</span>
      <ChevronDown />
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
      className="inline-flex h-10 min-h-[40px] items-center rounded-md border border-white/25 bg-white/10 px-3 text-[12px] font-semibold text-white hover:bg-white/15"
    >
      {label}
    </button>
  )
}

function PagerButton({
  label,
  onClick,
  disabled,
  active,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex h-10 min-h-[40px] min-w-10 items-center justify-center rounded-md px-2.5 text-[12px] font-semibold transition',
        active
          ? 'bg-navy text-white'
          : 'border border-border bg-white text-navy hover:bg-page disabled:cursor-not-allowed disabled:opacity-40',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
