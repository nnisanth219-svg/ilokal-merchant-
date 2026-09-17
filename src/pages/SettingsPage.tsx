import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listAdminRolesApi } from '../services/adminUserApi'
import { getSettingsApi, updateSettingSectionApi } from '../services/settingsApi'
import { canEditInModule } from '../types/auth'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import type { AppSettingsState, SettingKey } from '../types/settings'
import type { AdminRole, RolePermissionMatrix } from '../types/adminUser'

type SettingsTab = 'general' | 'team' | 'security' | 'notifications'
type SavableTab = Exclude<SettingsTab, 'team'>

const ROLE_ORDER: AdminRole[] = ['Super Admin', 'Admin', 'Operations']

const ROLE_PERMISSION_BLURBS: Record<AdminRole, string> = {
  'Super Admin': 'Full access to every module, settings and audit controls.',
  Admin: 'CMS management for merchants, offers, members and reviews.',
  Operations: 'Monitoring access for merchants, offers and redemptions.',
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = canEditInModule(user, 'Settings')
  const [tab, setTab] = useState<SettingsTab>('general')
  const [draft, setDraft] = useState<AppSettingsState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)
  const [roles, setRoles] = useState<RolePermissionMatrix[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getSettingsApi()
      .then((data) => {
        if (!cancelled) setDraft(structuredClone(data))
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load settings')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (tab !== 'team') return
    let cancelled = false
    setRolesLoading(true)
    setRolesError(null)
    listAdminRolesApi()
      .then((data) => {
        if (!cancelled) setRoles(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setRoles([])
          setRolesError(err instanceof Error ? err.message : 'Unable to load roles')
        }
      })
      .finally(() => {
        if (!cancelled) setRolesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tab])

  async function save(): Promise<void> {
    if (!draft || tab === 'team' || saving) return
    const key = tab as SettingKey & SavableTab
    setSaving(true)
    setError(null)
    try {
      const updated = await updateSettingSectionApi(key, draft[key])
      setDraft((d) => (d ? { ...d, [key]: updated } : d))
      setSavedBanner(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings')
      setSavedBanner(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Settings</h1>
          <p className="mt-0.5 text-[12px] text-muted">
            Manage your iLokal admin portal preferences and configuration.
          </p>
          {error ? <p className="mt-1 text-[12px] text-action">{error}</p> : null}
        </div>

        <div className="mt-4 flex flex-nowrap gap-1 overflow-x-auto overscroll-x-contain border-b border-border">
          <TabButton
            active={tab === 'general'}
            label="General"
            onClick={() => setTab('general')}
          />
          <TabButton
            active={tab === 'team'}
            label="Team & Roles"
            onClick={() => setTab('team')}
          />
          <TabButton
            active={tab === 'security'}
            label="Security"
            onClick={() => setTab('security')}
          />
          <TabButton
            active={tab === 'notifications'}
            label="Notifications"
            onClick={() => setTab('notifications')}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {savedBanner ? (
          <div className="mb-4 rounded-xl border border-success/20 bg-[#E8F6F0] px-4 py-3 text-[13px] font-medium text-success">
            Settings saved
          </div>
        ) : null}

        {loading && !draft ? <LoadingSpinner /> : null}

        {!loading && !draft ? (
          <p className="py-14 text-center text-[13px] text-muted">
            {error ?? 'Unable to load settings.'}
          </p>
        ) : null}

        {draft && tab === 'general' ? (
          <section className="mx-auto max-w-2xl rounded-xl border border-border bg-white p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-navy">General</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Platform identity and default regional preferences.
            </p>
            <div className="mt-4 space-y-4">
              <Field
                label="Platform name"
                value={draft.general.platformName}
                onChange={(v) =>
                  setDraft((d) =>
                    d ? { ...d, general: { ...d.general, platformName: v } } : d,
                  )
                }
              />
              <Field
                label="Admin portal name"
                value={draft.general.adminPortalName}
                onChange={(v) =>
                  setDraft((d) =>
                    d ? { ...d, general: { ...d.general, adminPortalName: v } } : d,
                  )
                }
              />
              <Field
                label="Support email"
                type="email"
                value={draft.general.supportEmail}
                onChange={(v) =>
                  setDraft((d) =>
                    d ? { ...d, general: { ...d.general, supportEmail: v } } : d,
                  )
                }
              />
              <Field
                label="Default country"
                value={draft.general.defaultCountry}
                onChange={(v) =>
                  setDraft((d) =>
                    d ? { ...d, general: { ...d.general, defaultCountry: v } } : d,
                  )
                }
              />
              <SelectField
                label="Timezone"
                value={draft.general.timezone}
                onChange={(v) =>
                  setDraft((d) =>
                    d ? { ...d, general: { ...d.general, timezone: v } } : d,
                  )
                }
                options={[
                  'Asia/Kuala_Lumpur',
                  'Asia/Singapore',
                  'Asia/Jakarta',
                  'UTC',
                ]}
              />
              <SelectField
                label="Date format"
                value={draft.general.dateFormat}
                onChange={(v) =>
                  setDraft((d) =>
                    d ? { ...d, general: { ...d.general, dateFormat: v } } : d,
                  )
                }
                options={['DD MMM YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY']}
              />
              <SelectField
                label="Language"
                value={draft.general.language}
                onChange={(v) =>
                  setDraft((d) =>
                    d ? { ...d, general: { ...d.general, language: v } } : d,
                  )
                }
                options={['English', 'Bahasa Melayu', '中文']}
              />
            </div>
            <div className="mt-6 flex justify-end">
              {canEdit ? <SaveButton onClick={() => void save()} disabled={saving} /> : null}
            </div>
          </section>
        ) : null}

        {tab === 'team' ? (
          <div className="mx-auto max-w-3xl space-y-4">
            {rolesError ? (
              <p className="text-[13px] text-action">{rolesError}</p>
            ) : null}
            {rolesLoading && roles.length === 0 ? <LoadingSpinner compact /> : null}
            {!rolesLoading && roles.length === 0 && !rolesError ? (
              <p className="py-14 text-center text-[13px] text-muted">No roles found.</p>
            ) : null}
            {ROLE_ORDER.map((roleName) => {
              const matrix = roles.find((m) => m.role === roleName)
              if (!matrix) return null
              return (
                <article
                  key={roleName}
                  className="rounded-xl border border-border bg-white px-5 py-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-[15px] font-bold text-navy">{roleName}</h2>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {matrix.description || ROLE_PERMISSION_BLURBS[roleName]}
                      </p>
                      <p className="mt-2 text-[12px] font-medium text-navy">
                        {matrix.userCount ?? 0} users · {ROLE_PERMISSION_BLURBS[roleName]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/admin-users')}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page"
                    >
                      Manage roles
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}

        {draft && tab === 'security' ? (
          <section className="mx-auto max-w-2xl rounded-xl border border-border bg-white p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-navy">Security</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Session, authentication and password policy controls.
            </p>
            <div className="mt-4 divide-y divide-border">
              <SettingRow
                title="Session timeout"
                description="Automatically sign out inactive administrators."
              >
                <select
                  value={draft.security.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            security: {
                              ...d.security,
                              sessionTimeoutMinutes: Number(e.target.value),
                            },
                          }
                        : d,
                    )
                  }
                  className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </SettingRow>
              <SettingRow
                title="Two-factor authentication"
                description="Require a second factor when signing in."
              >
                <Toggle
                  checked={draft.security.twoFactorEnabled}
                  onChange={(checked) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            security: { ...d.security, twoFactorEnabled: checked },
                          }
                        : d,
                    )
                  }
                  label="Two-factor authentication"
                />
              </SettingRow>
              <SettingRow
                title="Password min length"
                description="Minimum characters required for admin passwords."
              >
                <select
                  value={draft.security.passwordMinLength}
                  onChange={(e) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            security: {
                              ...d.security,
                              passwordMinLength: Number(e.target.value),
                            },
                          }
                        : d,
                    )
                  }
                  className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                >
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                  <option value={12}>12</option>
                  <option value={14}>14</option>
                </select>
              </SettingRow>
              <SettingRow
                title="Require strong password"
                description="Enforce mixed case, numbers and symbols."
              >
                <Toggle
                  checked={draft.security.requireStrongPassword}
                  onChange={(checked) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            security: { ...d.security, requireStrongPassword: checked },
                          }
                        : d,
                    )
                  }
                  label="Require strong password"
                />
              </SettingRow>
              <SettingRow
                title="Lockout after failures"
                description="Temporarily lock accounts after failed attempts."
              >
                <select
                  value={draft.security.lockoutAfterFailures}
                  onChange={(e) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            security: {
                              ...d.security,
                              lockoutAfterFailures: Number(e.target.value),
                            },
                          }
                        : d,
                    )
                  }
                  className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </SettingRow>
            </div>
            <div className="mt-6 flex justify-end">
              {canEdit ? <SaveButton onClick={() => void save()} disabled={saving} /> : null}
            </div>
          </section>
        ) : null}

        {draft && tab === 'notifications' ? (
          <section className="mx-auto max-w-2xl rounded-xl border border-border bg-white p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-navy">Notifications</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Choose which admin portal alerts you receive.
            </p>
            <div className="mt-4 divide-y divide-border">
              <SettingRow
                title="New admin invitation"
                description="Notify when an administrator invitation is sent."
              >
                <Toggle
                  checked={draft.notifications.newAdminInvitation}
                  onChange={(checked) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            notifications: {
                              ...d.notifications,
                              newAdminInvitation: checked,
                            },
                          }
                        : d,
                    )
                  }
                  label="New admin invitation"
                />
              </SettingRow>
              <SettingRow
                title="Merchant approval"
                description="Alerts for merchant onboarding and approval requests."
              >
                <Toggle
                  checked={draft.notifications.merchantApproval}
                  onChange={(checked) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            notifications: {
                              ...d.notifications,
                              merchantApproval: checked,
                            },
                          }
                        : d,
                    )
                  }
                  label="Merchant approval"
                />
              </SettingRow>
              <SettingRow
                title="Offer status changes"
                description="Updates when offers go live, pause or expire."
              >
                <Toggle
                  checked={draft.notifications.offerStatusChanges}
                  onChange={(checked) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            notifications: {
                              ...d.notifications,
                              offerStatusChanges: checked,
                            },
                          }
                        : d,
                    )
                  }
                  label="Offer status changes"
                />
              </SettingRow>
              <SettingRow
                title="Redemption alerts"
                description="Operational alerts for unusual redemption activity."
              >
                <Toggle
                  checked={draft.notifications.redemptionAlerts}
                  onChange={(checked) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            notifications: {
                              ...d.notifications,
                              redemptionAlerts: checked,
                            },
                          }
                        : d,
                    )
                  }
                  label="Redemption alerts"
                />
              </SettingRow>
              <SettingRow
                title="System notifications"
                description="Platform maintenance and system-level notices."
              >
                <Toggle
                  checked={draft.notifications.systemNotifications}
                  onChange={(checked) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            notifications: {
                              ...d.notifications,
                              systemNotifications: checked,
                            },
                          }
                        : d,
                    )
                  }
                  label="System notifications"
                />
              </SettingRow>
            </div>
            <div className="mt-6 flex justify-end">
              {canEdit ? <SaveButton onClick={() => void save()} disabled={saving} /> : null}
            </div>
          </section>
        ) : null}
      </div>
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
        'inline-flex min-h-[40px] shrink-0 items-end whitespace-nowrap border-b-2 px-3 pb-2.5 text-[13px] font-semibold transition',
        active ? 'border-navy text-navy' : 'border-transparent text-muted hover:text-navy',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-navy">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-navy">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  )
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-navy">{title}</p>
        <p className="mt-0.5 text-[12px] text-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="h-[16px] w-[16px] accent-navy"
      />
      <span className="text-[12px] font-medium text-navy">{checked ? 'On' : 'Off'}</span>
    </label>
  )
}

function SaveButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white hover:bg-navy-secondary disabled:opacity-60"
    >
      Save changes
    </button>
  )
}
