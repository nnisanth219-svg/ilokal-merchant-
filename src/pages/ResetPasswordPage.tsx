import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthSplitLayout } from '../components/login/AuthSplitLayout'
import { PasswordField } from '../components/login/PasswordField'
import { resetPasswordRequest } from '../services/authApi'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!token) {
      setError('This reset link is missing a token.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await resetPasswordRequest(token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout title="Choose a new password">
      {done ? (
        <div className="mt-6">
          <p className="rounded-md border border-navy/15 bg-page px-3 py-2 text-[13px] text-navy">
            Your password has been updated. You can now sign in.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 flex h-[46px] w-full items-center justify-center rounded-lg bg-navy text-[15px] font-semibold text-white hover:bg-[#0d2449]"
          >
            Go to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={(event) => void onSubmit(event)} className="mt-7 flex flex-col gap-4">
          {!token ? (
            <p className="rounded-md border border-coral/30 bg-coral/5 px-3 py-2 text-[12px] text-coral">
              This reset link is invalid. Request a new one from the sign-in page.
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
            disabled={loading || !token}
            onChange={setPassword}
            onToggleVisibility={() => setShowPassword((current) => !current)}
          />
          <button
            type="submit"
            disabled={loading || !token}
            className="flex h-[46px] w-full items-center justify-center rounded-lg bg-navy text-[15px] font-semibold text-white hover:bg-[#0d2449] disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthSplitLayout>
  )
}
