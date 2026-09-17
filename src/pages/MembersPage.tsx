import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { MemberStatusBadge } from '../components/members/MemberStatusBadge'
import {
  MobileRecordCard,
  MobileRecordField,
  MobileRecordFields,
  MobileRecordList,
  MobileRecordTop,
  MobileSelect,
  ResponsiveRecordLayout,
} from '../components/cms/MobileRecordCard'
import { ListPager } from '../components/cms/AdminListPrimitives'
import {
  RowActionButton,
  ViewportAwareMenu,
  type ViewportMenuItem,
} from '../components/ui/ViewportAwareMenu'
import { useAuth } from '../context/AuthContext'
import {
  broadcastMembersApi,
  bulkSoftDeleteMembersApi,
  bulkUpdateMemberStatusApi,
  listMembersApi,
  restoreMemberApi,
  softDeleteMemberApi,
  updateMemberStatusApi,
  type MemberListResponse,
} from '../services/memberApi'
import { downloadCsv } from '../utils/csv'
import { collectAllPages } from '../utils/paginate'
import { canDeleteInModule, canEditInModule } from '../types/auth'
import {
  MEMBER_PLAN_FILTERS,
  MEMBER_STATUS_FILTERS,
  type JoinedFilter,
  type Member,
  type MembershipPlan,
  type MemberStatus,
} from '../types/member'

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
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const canEdit = canEditInModule(user, 'Members')
  const canDelete = canDeleteInModule(user, 'Members')
  const canMutate = canEdit || canDelete
  const [members, setMembers] = useState<Member[]>([])
  const [summary, setSummary] = useState<MemberListResponse['summary']>({
    total: 0,
    active: 0,
    expired: 0,
    suspended: 0,
    inactive: 0,
  })
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
  const [plan, setPlan] = useState<PlanFilter>('all')
  const [joined, setJoined] = useState<JoinedFilter>('any')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [merchantId, setMerchantId] = useState(() => searchParams.get('merchantId') || '')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [confirm, setConfirm] = useState<{
    type: 'deactivate' | 'delete' | 'restore'
    member: Member
  } | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'deactivate' | 'delete' | null>(
    null,
  )
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [busyAction, setBusyAction] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const urlMerchantId = searchParams.get('merchantId') || ''
  useEffect(() => {
    setMerchantId(urlMerchantId)
    setPage(1)
  }, [urlMerchantId])

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listMembersApi({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        status,
        plan,
        joined,
        includeDeleted: includeDeleted || status === 'deleted',
        merchantId: merchantId || undefined,
      })
      setMembers(data.members)
      setSummary(data.summary)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load members')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status, plan, joined, includeDeleted, merchantId])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  const pageItems = members
  const totalPages = Math.max(1, pagination.totalPages)
  const currentPage = Math.min(page, totalPages)
  const total = pagination.total
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, total)
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
        ...(activeMember.status === 'deleted'
          ? canDelete
            ? [
                {
                  id: 'restore',
                  label: 'Restore',
                  onClick: () => setConfirm({ type: 'restore' as const, member: activeMember }),
                },
              ]
            : []
          : [
              ...(canEdit
                ? [
                    {
                      id: 'deactivate',
                      label: 'Deactivate',
                      onClick: () =>
                        setConfirm({ type: 'deactivate' as const, member: activeMember }),
                    },
                  ]
                : []),
              ...(canDelete
                ? [
                    {
                      id: 'delete',
                      label: 'Delete',
                      destructive: true,
                      dividerBefore: true,
                      onClick: () => setConfirm({ type: 'delete' as const, member: activeMember }),
                    },
                  ]
                : []),
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

  async function handleConfirm(): Promise<void> {
    if (!confirm) return
    try {
      setError(null)
      if (confirm.type === 'deactivate') {
        await updateMemberStatusApi(confirm.member.id, 'inactive')
      }
      if (confirm.type === 'delete') await softDeleteMemberApi(confirm.member.id)
      if (confirm.type === 'restore') await restoreMemberApi(confirm.member.id)
      setConfirm(null)
      closeMenu()
      await loadMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update member')
      setConfirm(null)
      closeMenu()
    }
  }

  async function runBulk(action: 'activate' | 'deactivate' | 'delete'): Promise<void> {
    try {
      setError(null)
      if (action === 'activate') await bulkUpdateMemberStatusApi(selectedIds, 'active')
      if (action === 'deactivate') await bulkUpdateMemberStatusApi(selectedIds, 'inactive')
      if (action === 'delete') await bulkSoftDeleteMembersApi(selectedIds)
      setSelectedIds([])
      setBulkConfirm(null)
      await loadMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update members')
      setBulkConfirm(null)
    }
  }

  async function handleExport(): Promise<void> {
    try {
      setError(null)
      setBusyAction('export')
      const all = await collectAllPages(async (pageNum, pageSize) => {
        const data = await listMembersApi({
          page: pageNum,
          pageSize,
          search: debouncedSearch,
          status,
          plan,
          joined,
          includeDeleted: includeDeleted || status === 'deleted',
          merchantId: merchantId || undefined,
        })
        return { items: data.members, totalPages: data.pagination.totalPages }
      })
      downloadCsv(
        'members.csv',
        ['memberCode', 'fullName', 'email', 'phone', 'city', 'plan', 'status', 'joinedAt'],
        all.map((member) => [
          member.memberCode,
          member.fullName,
          member.email,
          member.phone,
          member.city,
          member.plan,
          member.status,
          member.joinedAt,
        ]),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export members')
    } finally {
      setBusyAction(null)
    }
  }

  async function handleBroadcast(): Promise<void> {
    try {
      setError(null)
      setBusyAction('broadcast')
      let ids = selectedIds
      if (ids.length === 0) {
        const all = await collectAllPages(async (pageNum, pageSize) => {
          const data = await listMembersApi({
            page: pageNum,
            pageSize,
            search: debouncedSearch,
            status,
            plan,
            joined,
            includeDeleted: includeDeleted || status === 'deleted',
            merchantId: merchantId || undefined,
          })
          return { items: data.members, totalPages: data.pagination.totalPages }
        })
        ids = all.map((member) => member.id)
      }
      const result = await broadcastMembersApi({
        ids,
        subject: broadcastSubject,
        message: broadcastMessage,
      })
      setBroadcastOpen(false)
      setBroadcastSubject('')
      setBroadcastMessage('')
      if (!result.emailConfigured) {
        setError(
          `Broadcast was not sent to ${result.requested} member(s) because email delivery is not configured.`,
        )
      } else if (result.sent === 0) {
        setError('No broadcast emails were delivered.')
      } else {
        setError(
          result.failed > 0
            ? `Broadcast sent to ${result.sent} member(s); ${result.failed} failed.`
            : `Broadcast sent to ${result.sent} member(s).`,
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send broadcast')
    } finally {
      setBusyAction(null)
    }
  }

  const renderMembersPager = (className?: string) => (
    <ListPager
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      total={total}
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
            <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Members</h1>
            <p className="mt-0.5 text-[12px] text-muted">
              Manage app users, membership status, subscriptions and member activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={busyAction === 'export'}
              className="inline-flex h-10 min-h-[40px] items-center rounded-lg border border-border bg-white px-4 text-[13px] font-semibold text-navy transition hover:bg-page disabled:opacity-60"
            >
              {busyAction === 'export' ? 'Exporting…' : 'Export CSV'}
            </button>
            {canEdit ? (
              <button
                type="button"
                onClick={() => setBroadcastOpen(true)}
                className="inline-flex h-10 min-h-[40px] items-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white transition hover:bg-navy-secondary"
              >
                Send broadcast
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 md:overflow-hidden">
        <div className="mb-4 shrink-0">
          <p className="text-[15px] font-semibold text-navy">
            Members ·{' '}
            <span className="text-muted">
              {summary.total.toLocaleString()} total · {summary.active.toLocaleString()} active
            </span>
          </p>
          {merchantId ? (
            <p className="mt-1 text-[12px] text-muted">
              Showing members who have redeemed at the selected merchant.
            </p>
          ) : null}
          {error ? <p className="mt-1 text-[12px] text-action">{error}</p> : null}
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
              <button
                type="button"
                onClick={() => {
                  setIncludeDeleted((v) => !v)
                  setPage(1)
                }}
                className={[
                  'inline-flex h-10 min-h-[40px] items-center rounded-lg border border-border bg-white px-3 text-[12px] font-semibold transition hover:bg-page',
                  includeDeleted ? 'text-navy' : 'text-[#3B6FB6]',
                ].join(' ')}
              >
                {includeDeleted ? 'Hide deleted' : 'Show deleted'}
              </button>
            </div>
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

        <ResponsiveRecordLayout
          loading={loading}
          itemCount={pageItems.length}
          emptyLabel="No members match your filters."
          renderPager={renderMembersPager}
          mobileCards={
            <MobileRecordList>
              {pageItems.map((member) => {
                const selected = selectedIds.includes(member.id)
                return (
                  <MobileRecordCard
                    key={member.id}
                    selected={selected}
                    muted={member.status === 'inactive' || member.status === 'deleted'}
                  >
                    <MobileRecordTop
                      select={
                        <MobileSelect
                          checked={selected}
                          onChange={() => toggleSelect(member.id)}
                          label={`Select ${member.fullName}`}
                        />
                      }
                      title={
                        <button
                          type="button"
                          onClick={() => navigate(`/members/${member.id}`)}
                          className="text-left hover:underline"
                        >
                          {member.fullName}
                        </button>
                      }
                      subtitle={member.memberCode}
                      badge={<MemberStatusBadge status={member.status} />}
                      action={
                        <RowActionButton
                          label={`Actions for ${member.fullName}`}
                          open={openMenuId === member.id}
                          onToggle={(el) => toggleMenu(member.id, el)}
                        />
                      }
                    />
                    <MobileRecordFields>
                      <MobileRecordField label="Email" value={member.email} wide />
                      <MobileRecordField label="Phone" value={member.phone} />
                      <MobileRecordField label="Plan" value={member.planLabel} />
                      <MobileRecordField label="Joined" value={formatDate(member.joinedAt)} />
                      {member.city ? <MobileRecordField label="City" value={member.city} /> : null}
                    </MobileRecordFields>
                  </MobileRecordCard>
                )
              })}
            </MobileRecordList>
          }
          table={
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
                    const membershipLabel =
                      member.status === 'deleted'
                        ? 'Deleted'
                        : member.status.charAt(0).toUpperCase() + member.status.slice(1)
                    return (
                      <tr
                        key={member.id}
                        className={[
                          'border-b border-border last:border-b-0',
                          selected ? 'bg-[#F7F9FC]' : 'bg-white hover:bg-[#FAFAF8]',
                          member.status === 'inactive' || member.status === 'deleted'
                            ? 'opacity-70'
                            : '',
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
                          {membershipLabel}
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
                  {!loading && pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-14 text-center text-[13px] text-muted">
                        No members match your filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
          }
        />
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
        onConfirm={() => void handleConfirm()}
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
        onConfirm={() => void handleConfirm()}
      />
      <ConfirmDialog
        open={confirm?.type === 'restore'}
        title="Restore member?"
        message={
          confirm
            ? `Restore ${confirm.member.fullName} to the member list? They will return as inactive.`
            : ''
        }
        confirmLabel="Restore"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void handleConfirm()}
      />
      <ConfirmDialog
        open={bulkConfirm === 'activate'}
        title="Bulk activate"
        message={`Activate ${selectedIds.length} members?`}
        confirmLabel="Activate"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => void runBulk('activate')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'deactivate'}
        title="Bulk deactivate"
        message={`Deactivate ${selectedIds.length} members?`}
        confirmLabel="Deactivate"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => void runBulk('deactivate')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'delete'}
        title="Bulk delete"
        message={`Remove ${selectedIds.length} members from the active list?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => void runBulk('delete')}
      />

      {broadcastOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border border-border bg-white p-6">
            <h2 className="text-[18px] font-bold text-navy">Send broadcast</h2>
            <p className="mt-2 text-[13px] text-muted">
              {selectedIds.length > 0
                ? `This will go to ${selectedIds.length} selected member(s).`
                : 'This will go to every member in the current filtered list.'}
            </p>
            <label className="mt-4 block">
              <span className="text-[12px] font-semibold text-navy">Subject</span>
              <input
                value={broadcastSubject}
                onChange={(event) => setBroadcastSubject(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-border px-3 text-[13px] text-navy outline-none focus:border-navy"
              />
            </label>
            <label className="mt-3 block">
              <span className="text-[12px] font-semibold text-navy">Message</span>
              <textarea
                value={broadcastMessage}
                onChange={(event) => setBroadcastMessage(event.target.value)}
                rows={5}
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-[13px] text-navy outline-none focus:border-navy"
              />
            </label>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg border border-border bg-white px-4 text-[13px] font-semibold text-navy hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyAction === 'broadcast'}
                onClick={() => void handleBroadcast()}
                className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white hover:bg-navy-secondary disabled:opacity-60"
              >
                {busyAction === 'broadcast' ? 'Sending…' : 'Send'}
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
    <label className="relative inline-flex h-10 min-h-[40px] items-center gap-1.5 rounded-lg border border-border bg-white pl-3 pr-2 text-[13px] text-navy">
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
