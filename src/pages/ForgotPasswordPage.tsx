import { useState, type FormEvent } from 'react'
import { EmailField } from '../components/login/EmailField'
import { AuthSplitLayout } from '../components/login/AuthSplitLayout'
import { forgotPasswordRequest } from '../services/authApi'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ emailConfigured: boolean; message: string } | null>(
    null,
  )
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!email.trim()) {
      setError('Email address is required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const next = await forgotPasswordRequest(email.trim())
      setResult(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request a password reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout title="Reset password">
      {result ? (
        <p
          className={[
            'mt-6 rounded-md px-3 py-2 text-[13px]',
            result.emailConfigured
              ? 'border border-navy/15 bg-page text-navy'
              : 'border border-coral/30 bg-coral/5 text-coral',
          ].join(' ')}
        >
          {result.message}
        </p>
      ) : (
        <form onSubmit={(event) => void onSubmit(event)} className="mt-7 flex flex-col gap-4">
          <p className="text-[13px] text-muted">
            Enter the email for your admin account. If email delivery is configured, we will send a
            reset link.
          </p>
          {error ? (
            <p className="rounded-md border border-coral/30 bg-coral/5 px-3 py-2 text-[12px] text-coral">
              {error}
            </p>
          ) : null}
          <EmailField value={email} error={undefined} disabled={loading} onChange={setEmail} />
          <button
            type="submit"
            disabled={loading}
            className="flex h-[46px] w-full items-center justify-center rounded-lg bg-navy text-[15px] font-semibold text-white hover:bg-[#0d2449] disabled:opacity-60"
          >
            {loading ? 'Checking…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthSplitLayout>
  )
}
