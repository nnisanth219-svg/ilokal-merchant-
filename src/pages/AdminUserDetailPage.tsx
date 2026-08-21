import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminUserStatusBadge } from '../components/adminUsers/AdminUserStatusBadge'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import {
  getAdminUserById,
  getRoleMatrices,
  setAdminUserStatus,
  subscribeAdminUsers,
  updateAdminUser,
} from '../services/adminUserStore'
import {
  ADMIN_ROLE_OPTIONS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  type AdminRole,
  type AdminUserStatus,
  type PermissionAction,
} from '../types/adminUser'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function actionLabel(action: PermissionAction): string {
  return action.charAt(0).toUpperCase() + action.slice(1)
}

export function AdminUserDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getAdminUserById(id))
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminRole>('Admin')
  const [status, setStatus] = useState<AdminUserStatus>('active')
  const [savedBanner, setSavedBanner] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  useEffect(() => {
    const found = getAdminUserById(id)
    setUser(found)
    if (found) {
      setFullName(found.fullName)
      setEmail(found.email)
      setRole(found.role)
      setStatus(found.status)
    }
    setSavedBanner(false)
    return subscribeAdminUsers(() => setUser(getAdminUserById(id)))
  }, [id])

  const matrix = useMemo(
    () => getRoleMatrices().find((m) => m.role === role),
    [role],
  )

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[20px] font-bold text-navy">Admin user not found</h1>
          <Link
            to="/admin-users"
            className="mt-3 inline-block text-[13px] font-semibold text-navy underline"
          >
            Back to admin users
          </Link>
        </div>
      </div>
    )
  }

  function handleSave(): void {
    updateAdminUser(user!.id, { fullName, email, role, status })
    setSavedBanner(true)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 bg-navy px-4 py-5 text-white sm:px-6 sm:py-6">
        <p className="text-[12px] text-white/65">
          <Link to="/admin-users" className="hover:text-white">
            Admin Users
          </Link>
          <span className="mx-1.5 text-white/40">/</span>
          <span className="text-gold">{user.fullName}</span>
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[16px] font-bold text-gold sm:h-16 sm:w-16 sm:text-[18px]">
              {initials(user.fullName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
                  {user.fullName}
                </h1>
                <span className="inline-flex items-center rounded-full bg-white/10 px-1 py-0.5">
                  <AdminUserStatusBadge status={user.status} />
                </span>
              </div>
              <p className="mt-1 break-words text-[13px] text-white/70">{user.email}</p>
              <p className="mt-1 text-[13px] text-white/55">{user.role}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin-users')}
              className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-9 min-h-[36px] flex-1 items-center justify-center rounded-lg bg-gold px-3.5 text-[13px] font-semibold text-navy hover:bg-[#e6c35a] sm:flex-none"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeactivate(true)}
              className="inline-flex h-9 min-h-[36px] w-full items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:w-auto"
            >
              Deactivate
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        {savedBanner ? (
          <div className="mb-4 rounded-xl border border-success/20 bg-[#E8F6F0] px-4 py-3 text-[13px] font-medium text-success">
            Changes saved successfully.
          </div>
        ) : null}

        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-navy">Profile</h2>
            <p className="mt-0.5 text-[12px] text-muted">Update account details and role assignment.</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-[12px] font-semibold text-navy">Full name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[12px] font-semibold text-navy">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-navy">Role</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                >
                  {ADMIN_ROLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-navy">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AdminUserStatus)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[15px] font-bold text-navy">Roles & permissions</h2>
              <p className="mt-0.5 text-[12px] text-muted">
                Read-only summary for {role}.
                {matrix ? ` ${matrix.description}` : ''}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-[#FAF9F6]">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                      Module
                    </th>
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
                        const checked = matrix?.permissions[module]?.includes(action) ?? false
                        return (
                          <td key={action} className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              disabled
                              aria-label={`${role} ${module} ${action}`}
                              className="h-[14px] w-[14px] accent-navy disabled:opacity-70"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeactivate}
        title="Deactivate admin?"
        message={`Deactivate “${user.fullName}”? They will lose access to the admin portal.`}
        confirmLabel="Deactivate"
        onCancel={() => setConfirmDeactivate(false)}
        onConfirm={() => {
          setAdminUserStatus(user.id, 'inactive')
          setStatus('inactive')
          setConfirmDeactivate(false)
        }}
      />
    </div>
  )
}
