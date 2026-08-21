import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { countUsersByRole, getRoleMatrices } from '../services/adminUserStore'
import {
  getSettings,
  subscribeSettings,
  updateSettings,
} from '../services/settingsStore'
import type { AppSettingsState } from '../types/settings'
import type { AdminRole } from '../types/adminUser'

type SettingsTab = 'general' | 'team' | 'security' | 'notifications'

const ROLE_ORDER: AdminRole[] = ['Super Admin', 'Admin', 'Operations']

const ROLE_PERMISSION_BLURBS: Record<AdminRole, string> = {
  'Super Admin': 'Full access to every module, settings and audit controls.',
  Admin: 'CMS management for merchants, offers, members and reviews.',
  Operations: 'Monitoring access for merchants, offers and redemptions.',
}

export function SettingsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<SettingsTab>('general')
  const [draft, setDraft] = useState<AppSettingsState>(() => structuredClone(getSettings()))
  const [savedBanner, setSavedBanner] = useState(false)

  useEffect(() => {
    return subscribeSettings(() => {
      setDraft(structuredClone(getSettings()))
    })
  }, [])

  function save(): void {
    updateSettings(draft)
    setSavedBanner(true)
  }

  const matrices = getRoleMatrices()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold tracking-[-0.02em] text-navy">Settings</h1>
          <p className="mt-0.5 text-[12px] text-muted">
            Manage your iLokal admin portal preferences and configuration.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1 border-b border-border">
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

        {tab === 'general' ? (
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
                  setDraft((d) => ({ ...d, general: { ...d.general, platformName: v } }))
                }
              />
              <Field
                label="Admin portal name"
                value={draft.general.adminPortalName}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, general: { ...d.general, adminPortalName: v } }))
                }
              />
              <Field
                label="Support email"
                type="email"
                value={draft.general.supportEmail}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, general: { ...d.general, supportEmail: v } }))
                }
              />
              <Field
                label="Default country"
                value={draft.general.defaultCountry}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, general: { ...d.general, defaultCountry: v } }))
                }
              />
              <SelectField
                label="Timezone"
                value={draft.general.timezone}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, general: { ...d.general, timezone: v } }))
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
                  setDraft((d) => ({ ...d, general: { ...d.general, dateFormat: v } }))
                }
                options={['DD MMM YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY']}
              />
              <SelectField
                label="Language"
                value={draft.general.language}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, general: { ...d.general, language: v } }))
                }
                options={['English', 'Bahasa Melayu', '中文']}
              />
            </div>
            <div className="mt-6 flex justify-end">
              <SaveButton onClick={save} />
            </div>
          </section>
        ) : null}

        {tab === 'team' ? (
          <div className="mx-auto max-w-3xl space-y-4">
            {ROLE_ORDER.map((roleName) => {
              const matrix = matrices.find((m) => m.role === roleName)
              return (
                <article
                  key={roleName}
                  className="rounded-xl border border-border bg-white px-5 py-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-[15px] font-bold text-navy">{roleName}</h2>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {matrix?.description ?? ROLE_PERMISSION_BLURBS[roleName]}
                      </p>
                      <p className="mt-2 text-[12px] font-medium text-navy">
                        {countUsersByRole(roleName)} users · {ROLE_PERMISSION_BLURBS[roleName]}
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

        {tab === 'security' ? (
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
                    setDraft((d) => ({
                      ...d,
                      security: {
                        ...d.security,
                        sessionTimeoutMinutes: Number(e.target.value),
                      },
                    }))
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
                    setDraft((d) => ({
                      ...d,
                      security: { ...d.security, twoFactorEnabled: checked },
                    }))
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
                    setDraft((d) => ({
                      ...d,
                      security: {
                        ...d.security,
                        passwordMinLength: Number(e.target.value),
                      },
                    }))
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
                    setDraft((d) => ({
                      ...d,
                      security: { ...d.security, requireStrongPassword: checked },
                    }))
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
                    setDraft((d) => ({
                      ...d,
                      security: {
                        ...d.security,
                        lockoutAfterFailures: Number(e.target.value),
                      },
                    }))
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
              <SaveButton onClick={save} />
            </div>
          </section>
        ) : null}

        {tab === 'notifications' ? (
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
                    setDraft((d) => ({
                      ...d,
                      notifications: { ...d.notifications, newAdminInvitation: checked },
                    }))
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
                    setDraft((d) => ({
                      ...d,
                      notifications: { ...d.notifications, merchantApproval: checked },
                    }))
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
                    setDraft((d) => ({
                      ...d,
                      notifications: { ...d.notifications, offerStatusChanges: checked },
                    }))
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
                    setDraft((d) => ({
                      ...d,
                      notifications: { ...d.notifications, redemptionAlerts: checked },
                    }))
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
                    setDraft((d) => ({
                      ...d,
                      notifications: { ...d.notifications, systemNotifications: checked },
                    }))
                  }
                  label="System notifications"
                />
              </SettingRow>
            </div>
            <div className="mt-6 flex justify-end">
              <SaveButton onClick={save} />
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
        'shrink-0 whitespace-nowrap border-b-2 px-3 pb-2.5 text-[13px] font-semibold transition',
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

function SaveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white hover:bg-navy-secondary"
    >
      Save changes
    </button>
  )
}
