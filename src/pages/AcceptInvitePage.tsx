import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthSplitLayout } from '../components/login/AuthSplitLayout'
import { PasswordField } from '../components/login/PasswordField'
import { useAuth } from '../context/AuthContext'
import { acceptInviteRequest, fetchInviteInfo } from '../services/authApi'
import { firstAllowedPath } from '../components/auth/UnauthorizedPage'

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const token = searchParams.get('token') ?? ''
  const [info, setInfo] = useState<{ email: string; name: string } | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!token) {
      setChecking(false)
      setError('This invitation link is missing a token.')
      return
    }
    let cancelled = false
    fetchInviteInfo(token)
      .then((data) => {
        if (!cancelled) setInfo(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'This invitation is invalid or has expired')
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const user = await acceptInviteRequest(token, password)
      await refresh()
      navigate(firstAllowedPath(user), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout title="Accept invitation">
      {checking ? (
        <p className="mt-6 text-[13px] text-muted">Checking invitation…</p>
      ) : (
        <form onSubmit={(event) => void onSubmit(event)} className="mt-7 flex flex-col gap-4">
          {info ? (
            <p className="text-[13px] text-muted">
              Set a password for <span className="font-semibold text-navy">{info.email}</span>
              {info.name ? ` (${info.name})` : ''}.
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-coral/30 bg-coral/5 px-3 py-2 text-[12px] text-coral">
              {error}
            </p>
          ) : null}
          <PasswordField
            value={password}
            showPassword={showPassword}
            disabled={loading || !info}
            onChange={setPassword}
            onToggleVisibility={() => setShowPassword((current) => !current)}
          />
          <button
            type="submit"
            disabled={loading || !info}
            className="flex h-[46px] w-full items-center justify-center rounded-lg bg-navy text-[15px] font-semibold text-white hover:bg-[#0d2449] disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Activate account'}
          </button>
        </form>
      )}
    </AuthSplitLayout>
  )
}
