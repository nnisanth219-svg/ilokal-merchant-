import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminUserStatusBadge } from '../components/adminUsers/AdminUserStatusBadge'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
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
import { ADMIN_USERS_SUMMARY } from '../data/adminUsers'
import {
  bulkDeleteAdminUsers,
  bulkSetAdminUserStatus,
  countUsersByRole,
  deleteAdminUser,
  getAdminUsers,
  getRoleMatrices,
  setAdminUserStatus,
  subscribeAdminUsers,
} from '../services/adminUserStore'
import {
  ADMIN_ROLE_FILTERS,
  ADMIN_STATUS_FILTERS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  type AdminRole,
  type AdminUser,
  type AdminUserStatus,
  type PermissionAction,
  type PermissionModule,
  type RolePermissionMatrix,
} from '../types/adminUser'

type StatusFilter = AdminUserStatus | 'all'
type RoleFilter = AdminRole | 'all'
type PageTab = 'users' | 'roles'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function actionLabel(action: PermissionAction): string {
  return action.charAt(0).toUpperCase() + action.slice(1)
}

export function AdminUsersPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<PageTab>('users')
  const [items, setItems] = useState(getAdminUsers)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [role, setRole] = useState<RoleFilter>('all')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [confirm, setConfirm] = useState<{
    type: 'deactivate' | 'delete'
    item: AdminUser
  } | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'deactivate' | 'delete' | null>(
    null,
  )
  const [matrices, setMatrices] = useState<RolePermissionMatrix[]>(() =>
    structuredClone(getRoleMatrices()),
  )

  useEffect(() => subscribeAdminUsers(() => setItems(getAdminUsers())), [])

  const filtered = useMemo(() => {
    return items.filter((u) => {
      if (status !== 'all' && u.status !== status) return false
      if (role !== 'all' && u.role !== role) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!`${u.fullName} ${u.email}`.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [items, status, role, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / CMS_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * CMS_PAGE_SIZE,
    currentPage * CMS_PAGE_SIZE,
  )
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * CMS_PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * CMS_PAGE_SIZE, filtered.length)
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((u) => selectedIds.includes(u.id))
  const pageNumbers = useMemo(
    () => pageWindow(currentPage, totalPages),
    [currentPage, totalPages],
  )

  const activeItem = pageItems.find((u) => u.id === openMenuId) ?? null

  const menuItems: ViewportMenuItem[] = activeItem
    ? [
        {
          id: 'view',
          label: 'View',
          onClick: () => navigate(`/admin-users/${activeItem.id}`),
        },
        {
          id: 'edit',
          label: 'Edit',
          onClick: () => navigate(`/admin-users/${activeItem.id}`),
        },
        {
          id: 'role',
          label: 'Change role',
          onClick: () => navigate(`/admin-users/${activeItem.id}`),
        },
        {
          id: 'deactivate',
          label: 'Deactivate',
          onClick: () => setConfirm({ type: 'deactivate', item: activeItem }),
        },
        {
          id: 'delete',
          label: 'Delete',
          destructive: true,
          dividerBefore: true,
          onClick: () => setConfirm({ type: 'delete', item: activeItem }),
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
      const pageIds = new Set(pageItems.map((u) => u.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)))
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      pageItems.forEach((u) => next.add(u.id))
      return [...next]
    })
  }

  function toggleSelect(id: string): void {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleConfirm(): void {
    if (!confirm) return
    if (confirm.type === 'deactivate') setAdminUserStatus(confirm.item.id, 'inactive')
    if (confirm.type === 'delete') deleteAdminUser(confirm.item.id)
    setConfirm(null)
    closeMenu()
  }

  function runBulk(action: 'activate' | 'deactivate' | 'delete'): void {
    if (action === 'activate') bulkSetAdminUserStatus(selectedIds, 'active')
    if (action === 'deactivate') bulkSetAdminUserStatus(selectedIds, 'inactive')
    if (action === 'delete') bulkDeleteAdminUsers(selectedIds)
    setSelectedIds([])
    setBulkConfirm(null)
  }

  function togglePermission(
    roleName: AdminRole,
    module: PermissionModule,
    action: PermissionAction,
  ): void {
    setMatrices((prev) =>
      prev.map((matrix) => {
        if (matrix.role !== roleName) return matrix
        const current = matrix.permissions[module] ?? []
        const has = current.includes(action)
        const nextActions = has
          ? current.filter((a) => a !== action)
          : [...current, action]
        return {
          ...matrix,
          permissions: {
            ...matrix.permissions,
            [module]: nextActions,
          },
        }
      }),
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Admin Users</h1>
            <p className="mt-0.5 text-[12px] text-muted">
              Manage administrator accounts, roles and permissions.
            </p>
          </div>
          <Link
            to="/admin-users/invite"
            className="inline-flex h-[38px] min-h-[38px] w-full items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white transition hover:bg-navy-secondary sm:w-auto"
          >
            + Invite admin
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-1 border-b border-border">
          <TabButton active={tab === 'users'} label="Users" onClick={() => setTab('users')} />
          <TabButton
            active={tab === 'roles'}
            label="Roles & permissions"
            onClick={() => setTab('roles')}
          />
        </div>
      </header>

      {tab === 'users' ? (
        <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
          <div className="mb-4 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label="Total admins" value={String(ADMIN_USERS_SUMMARY.total)} />
            <SummaryCard label="Active" value={String(ADMIN_USERS_SUMMARY.active)} />
            <SummaryCard label="Pending" value={String(ADMIN_USERS_SUMMARY.pending)} />
            <SummaryCard label="Inactive" value={String(ADMIN_USERS_SUMMARY.inactive)} />
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
                  placeholder="Search by name or email"
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
                  options={ADMIN_STATUS_FILTERS.map((f) => ({
                    value: f.value,
                    label: f.label,
                  }))}
                />
                <FilterPill
                  label="Role"
                  value={role}
                  displayValue={role === 'all' ? 'All' : role}
                  onChange={(v) => {
                    setRole(v as RoleFilter)
                    setPage(1)
                  }}
                  options={ADMIN_ROLE_FILTERS.map((f) => ({
                    value: f.value,
                    label: f.label,
                  }))}
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
                <table className="min-w-[980px] w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-[#FAF9F6]">
                      <th className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAll}
                          aria-label="Select all admins on page"
                          className="h-[14px] w-[14px] accent-navy"
                        />
                      </th>
                      <Th>Admin</Th>
                      <Th>Email</Th>
                      <Th>Role</Th>
                      <Th>Status</Th>
                      <Th>Last active</Th>
                      <Th>Created</Th>
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
                            row.status === 'inactive' ? 'opacity-70' : '',
                          ].join(' ')}
                        >
                          <td className="px-4 py-3.5 align-middle">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelect(row.id)}
                              aria-label={`Select ${row.fullName}`}
                              className="h-[14px] w-[14px] accent-navy"
                            />
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin-users/${row.id}`)}
                              className="flex items-center gap-2.5 text-left"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[11px] font-bold text-navy">
                                {initials(row.fullName)}
                              </span>
                              <span className="text-[13px] font-semibold text-navy hover:underline">
                                {row.fullName}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-[13px] text-muted">
                            {row.email}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                            {row.role}
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <AdminUserStatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                            {row.lastActiveLabel}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                            {formatDate(row.createdAt)}
                          </td>
                          <td className="px-3 py-3.5 align-middle">
                            <RowActionButton
                              label={`Actions for ${row.fullName}`}
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
                          No admin users match your filters.
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
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-4">
            {matrices.map((matrix) => (
              <article
                key={matrix.role}
                className="overflow-hidden rounded-xl border border-border bg-white"
              >
                <div className="border-b border-border px-5 py-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-[15px] font-bold text-navy">{matrix.role}</h2>
                      <p className="mt-0.5 text-[12px] text-muted">{matrix.description}</p>
                    </div>
                    <p className="shrink-0 text-[12px] font-semibold text-navy">
                      {countUsersByRole(matrix.role)} users
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[720px] w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border bg-[#FAF9F6]">
                        <Th>Module</Th>
                        {PERMISSION_ACTIONS.map((action) => (
                          <th
                            key={action}
                            className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
                          >
                            {actionLabel(action)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERMISSION_MODULES.map((module) => (
                        <tr key={module} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-3 text-[13px] font-medium text-navy">{module}</td>
                          {PERMISSION_ACTIONS.map((action) => {
                            const checked =
                              matrix.permissions[module]?.includes(action) ?? false
                            return (
                              <td key={action} className="px-3 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    togglePermission(matrix.role, module, action)
                                  }
                                  aria-label={`${matrix.role} ${module} ${action}`}
                                  className="h-[14px] w-[14px] accent-navy"
                                />
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <ViewportAwareMenu
        open={Boolean(openMenuId && menuAnchor)}
        anchorEl={menuAnchor}
        items={menuItems}
        onClose={closeMenu}
      />

      <ConfirmDialog
        open={confirm?.type === 'deactivate'}
        title="Deactivate admin?"
        message={
          confirm
            ? `Deactivate “${confirm.item.fullName}”? They will lose access to the admin portal.`
            : ''
        }
        confirmLabel="Deactivate"
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={confirm?.type === 'delete'}
        title="Delete admin?"
        message={
          confirm
            ? `Permanently delete “${confirm.item.fullName}”? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete admin"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={bulkConfirm === 'activate'}
        title="Bulk activate"
        message={`Activate ${selectedIds.length} admin users? Frontend only.`}
        confirmLabel="Activate"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('activate')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'deactivate'}
        title="Bulk deactivate"
        message={`Deactivate ${selectedIds.length} admin users? Frontend only.`}
        confirmLabel="Deactivate"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('deactivate')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'delete'}
        title="Bulk delete"
        message={`Delete ${selectedIds.length} admin users? Frontend only.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => runBulk('delete')}
      />
    </div>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 border-b-2 px-3 pb-2.5 text-[13px] font-semibold transition',
        active ? 'border-navy text-navy' : 'border-transparent text-muted hover:text-navy',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
