import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CategoryStatusBadge } from '../components/categories/CategoryStatusBadge'
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
import { useAuth } from '../context/AuthContext'
import {
  canCreateInModule,
  canDeleteInModule,
  canEditInModule,
} from '../types/auth'
import {
  bulkSoftDeleteCategoriesApi,
  bulkUpdateCategoryStatusApi,
  listCategoriesApi,
  restoreCategoryApi,
  softDeleteCategoryApi,
  updateCategoryStatusApi,
  type CategoryListResponse,
} from '../services/categoryApi'
import {
  CATEGORY_STATUS_FILTERS,
  type CategoryItem,
  type CategoryStatus,
} from '../types/category'

type StatusFilter = CategoryStatus | 'all'

export function CategoriesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreate = canCreateInModule(user, 'Categories')
  const canEdit = canEditInModule(user, 'Categories')
  const canDelete = canDeleteInModule(user, 'Categories')
  const canMutate = canEdit || canDelete
  const [items, setItems] = useState<CategoryItem[]>([])
  const [summary, setSummary] = useState<CategoryListResponse['summary']>({
    total: 0,
    active: 0,
    withMerchants: 0,
    empty: 0,
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
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [confirm, setConfirm] = useState<{
    type: 'deactivate' | 'delete' | 'restore'
    item: CategoryItem
  } | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'deactivate' | 'delete' | null>(
    null,
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listCategoriesApi({
        page,
        pageSize: CMS_PAGE_SIZE,
        search: debouncedSearch,
        status,
        includeDeleted: status === 'deleted',
      })
      setItems(data.categories)
      setSummary(data.summary)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load categories')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const pageItems = items
  const totalPages = Math.max(1, pagination.totalPages)
  const currentPage = Math.min(page, totalPages)
  const total = pagination.total
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * CMS_PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * CMS_PAGE_SIZE, total)
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((c) => selectedIds.includes(c.id))
  const pageNumbers = useMemo(
    () => pageWindow(currentPage, totalPages),
    [currentPage, totalPages],
  )

  const activeItem = pageItems.find((c) => c.id === openMenuId) ?? null

  const menuItems: ViewportMenuItem[] = activeItem
    ? [
        ...(canEdit
          ? [
              {
                id: 'edit',
                label: 'Edit',
                onClick: () => navigate(`/categories/${activeItem.id}/edit`),
              },
            ]
          : []),
        {
          id: 'merchants',
          label: 'View merchants',
          onClick: () => navigate(`/merchants?category=${encodeURIComponent(activeItem.name)}`),
        },
        {
          id: 'offers',
          label: 'View offers',
          onClick: () => navigate(`/offers?category=${encodeURIComponent(activeItem.name)}`),
        },
        ...(activeItem.status === 'deleted'
          ? canDelete
            ? [
                {
                  id: 'restore',
                  label: 'Restore',
                  onClick: () => setConfirm({ type: 'restore' as const, item: activeItem }),
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
                        setConfirm({ type: 'deactivate' as const, item: activeItem }),
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
                      onClick: () => setConfirm({ type: 'delete' as const, item: activeItem }),
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
      const pageIds = new Set(pageItems.map((c) => c.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)))
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      pageItems.forEach((c) => next.add(c.id))
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
        await updateCategoryStatusApi(confirm.item.id, 'inactive')
      }
      if (confirm.type === 'delete') await softDeleteCategoryApi(confirm.item.id)
      if (confirm.type === 'restore') await restoreCategoryApi(confirm.item.id)
      setConfirm(null)
      closeMenu()
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update category')
      setConfirm(null)
      closeMenu()
    }
  }

  async function runBulk(action: 'activate' | 'deactivate' | 'delete'): Promise<void> {
    try {
      setError(null)
      if (action === 'activate') await bulkUpdateCategoryStatusApi(selectedIds, 'active')
      if (action === 'deactivate') await bulkUpdateCategoryStatusApi(selectedIds, 'inactive')
      if (action === 'delete') await bulkSoftDeleteCategoriesApi(selectedIds)
      setSelectedIds([])
      setBulkConfirm(null)
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update categories')
      setBulkConfirm(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Categories</h1>
            <p className="mt-0.5 text-[12px] text-muted">
              Manage merchant categories used across the iLokal platform.
            </p>
            {error ? <p className="mt-1 text-[12px] text-action">{error}</p> : null}
          </div>
          {canCreate ? (
            <Link
              to="/categories/create"
              className="inline-flex h-10 min-h-[40px] w-full items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white transition hover:bg-navy-secondary sm:w-auto"
            >
              + Add category
            </Link>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Total categories" value={String(summary.total)} />
          <SummaryCard label="Active" value={String(summary.active)} />
          <SummaryCard label="With merchants" value={String(summary.withMerchants)} />
          <SummaryCard label="Empty" value={String(summary.empty)} />
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
                placeholder="Search by category name"
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
                options={CATEGORY_STATUS_FILTERS.map((f) => ({
                  value: f.value,
                  label: f.label,
                }))}
              />
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
                        aria-label="Select all categories on page"
                        className="h-[14px] w-[14px] accent-navy"
                      />
                    </th>
                    <Th>Category</Th>
                    <Th>Description</Th>
                    <Th>Merchants</Th>
                    <Th>Offers</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading && pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center text-[13px] text-muted">
                        Loading categories…
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
                          row.status === 'inactive' || row.status === 'deleted'
                            ? 'opacity-70'
                            : '',
                        ].join(' ')}
                      >
                        <td className="px-4 py-3.5 align-middle">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(row.id)}
                            aria-label={`Select ${row.name}`}
                            className="h-[14px] w-[14px] accent-navy"
                          />
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/categories/${row.id}/edit`)}
                              className="text-left text-[13px] font-semibold text-navy hover:underline"
                            >
                              {row.name}
                            </button>
                          ) : (
                            <span className="text-[13px] font-semibold text-navy">{row.name}</span>
                          )}
                        </td>
                        <td className="max-w-[280px] px-4 py-3.5 align-middle text-[13px] text-muted">
                          <span className="line-clamp-2">{row.description}</span>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] tabular-nums text-navy">
                          {row.merchantsCount}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] tabular-nums text-navy">
                          {row.offersCount}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <CategoryStatusBadge status={row.status} />
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[13px] text-navy">
                          {formatDate(row.updatedAt)}
                        </td>
                        <td className="px-3 py-3.5 align-middle">
                          <RowActionButton
                            label={`Actions for ${row.name}`}
                            open={openMenuId === row.id}
                            onToggle={(el) => toggleMenu(row.id, el)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center text-[13px] text-muted">
                        No categories match your filters.
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
        open={confirm?.type === 'deactivate'}
        title="Deactivate category?"
        message={
          confirm
            ? `Deactivate “${confirm.item.name}”? Merchants can no longer use this category.`
            : ''
        }
        confirmLabel="Deactivate"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void handleConfirm()}
      />
      <ConfirmDialog
        open={confirm?.type === 'delete'}
        title="Delete category?"
        message={
          confirm
            ? `Soft delete “${confirm.item.name}”? It can be restored later.`
            : ''
        }
        confirmLabel="Delete category"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => void handleConfirm()}
      />
      <ConfirmDialog
        open={confirm?.type === 'restore'}
        title="Restore category?"
        message={
          confirm
            ? `Restore “${confirm.item.name}”? It will return as inactive.`
            : ''
        }
        confirmLabel="Restore"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void handleConfirm()}
      />
      <ConfirmDialog
        open={bulkConfirm === 'activate'}
        title="Bulk activate"
        message={`Activate ${selectedIds.length} categories?`}
        confirmLabel="Activate"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => void runBulk('activate')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'deactivate'}
        title="Bulk deactivate"
        message={`Deactivate ${selectedIds.length} categories?`}
        confirmLabel="Deactivate"
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => void runBulk('deactivate')}
      />
      <ConfirmDialog
        open={bulkConfirm === 'delete'}
        title="Bulk delete"
        message={`Soft delete ${selectedIds.length} categories? They can be restored later.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setBulkConfirm(null)}
        onConfirm={() => void runBulk('delete')}
      />
    </div>
  )
}
