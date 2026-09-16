import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { inviteAdminUserApi } from '../services/adminUserApi'
import { ADMIN_ROLE_OPTIONS, type AdminRole } from '../types/adminUser'

export function InviteAdminPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminRole>('Admin')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{
    email: string
    emailSent: boolean
    emailConfigured: boolean
    inviteUrl: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  function resetForm(): void {
    setFullName('')
    setEmail('')
    setRole('Admin')
    setError(null)
    setSaving(false)
    setResult(null)
    setCopied(false)
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const created = await inviteAdminUserApi({ fullName, email, role })
      setResult({
        email: created.email,
        emailSent: created.emailSent,
        emailConfigured: created.emailConfigured,
        inviteUrl: created.inviteUrl,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to invite admin user')
    } finally {
      setSaving(false)
    }
  }

  async function copyInviteLink(): Promise<void> {
    if (!result?.inviteUrl) return
    try {
      await navigator.clipboard.writeText(result.inviteUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Unable to copy the invitation link')
    }
  }

  if (result) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
        <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
          <p className="text-[12px] text-muted">
            <Link to="/admin-users" className="font-medium text-navy hover:underline">
              Admin Users
            </Link>
            <span className="mx-1.5 text-muted/50">/</span>
            <span>Invite admin</span>
          </p>
          <h1 className="mt-1 text-[18px] font-bold tracking-[-0.02em] text-navy">
            Invite admin
          </h1>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-2xl rounded-xl border border-border bg-white p-5 sm:p-6">
            <div
              className={[
                'flex h-12 w-12 items-center justify-center rounded-full',
                result.emailSent ? 'bg-[#E8F6F0] text-success' : 'bg-[#FFF4D6] text-[#A67A00]',
              ].join(' ')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-[18px] font-bold text-navy">
              {result.emailSent ? 'Invitation email sent' : 'Admin invitation created'}
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              {result.emailSent
                ? `An invitation email was sent to ${result.email}.`
                : result.emailConfigured
                  ? `The admin account for ${result.email} was created, but the invitation email could not be delivered.`
                  : `The admin account for ${result.email} was created. Email delivery is not configured, so no invitation email was sent. Share the link below instead.`}
            </p>
            <div className="mt-4 rounded-lg border border-border bg-page px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Invitation link
              </p>
              <p className="mt-1 break-all text-[12px] text-navy">{result.inviteUrl}</p>
              <button
                type="button"
                onClick={() => void copyInviteLink()}
                className="mt-3 inline-flex h-10 min-h-[40px] items-center rounded-lg border border-border bg-white px-3 text-[12px] font-semibold text-navy hover:bg-white"
              >
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/admin-users')}
                className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg border border-border bg-white px-4 text-[13px] font-semibold text-navy hover:bg-page"
              >
                Back to admin users
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white hover:bg-navy-secondary"
              >
                Invite another
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <p className="text-[12px] text-muted">
          <Link to="/admin-users" className="font-medium text-navy hover:underline">
            Admin Users
          </Link>
          <span className="mx-1.5 text-muted/50">/</span>
          <span>Invite admin</span>
        </p>
        <h1 className="mt-1 text-[18px] font-bold tracking-[-0.02em] text-navy">Invite admin</h1>
        <p className="mt-0.5 text-[12px] text-muted">
          Create a pending administrator and share an invitation link. Email is sent only when SMTP is configured.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mx-auto max-w-2xl rounded-xl border border-border bg-white p-5 sm:p-6"
        >
          <div className="space-y-4">
            <label className="block">
              <span className="text-[12px] font-semibold text-navy">
                Full name <span className="text-action">*</span>
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aisyah Rahman"
                disabled={saving}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-[12px] font-semibold text-navy">
                Email <span className="text-action">*</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@ilokal.my"
                disabled={saving}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-[12px] font-semibold text-navy">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
                disabled={saving}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:opacity-60"
              >
                {ADMIN_ROLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? <p className="mt-4 text-[13px] font-medium text-action">{error}</p> : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin-users')}
              disabled={saving}
              className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg border border-border bg-white px-4 text-[13px] font-semibold text-navy hover:bg-page disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white hover:bg-navy-secondary disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
