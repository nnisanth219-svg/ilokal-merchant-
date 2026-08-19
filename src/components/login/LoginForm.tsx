import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { AuthErrorState, LoginFormErrors, LoginFormValues } from '../../types/auth'
import { EmailField } from './EmailField'
import { LoginOptions } from './LoginOptions'
import { PasswordField } from './PasswordField'
import { SignInButton } from './SignInButton'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {}

  if (!values.email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  }

  return errors
}

interface LoginFormProps {
  authError?: AuthErrorState | null
  onAuthError?: (error: AuthErrorState | null) => void
  onAuthErrorClear?: () => void
}

export function LoginForm({
  authError = null,
  onAuthError,
  onAuthErrorClear,
}: LoginFormProps) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
    keepSignedIn: true,
  })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const updateField = <K extends keyof LoginFormValues>(key: K, value: LoginFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    onAuthErrorClear?.()
    onAuthError?.(null)
  }

  const handleForgotPassword = () => {
    // Placeholder — forgot-password flow lands in a later screen.
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setLoading(true)
    onAuthError?.(null)

    try {
      await login(values.email.trim(), values.password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid email or password'

      onAuthError?.({
        code: 'invalid_credentials',
        message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
      {authError ? (
        <p
          className="rounded-md border border-coral/30 bg-coral/5 px-3 py-2 text-[12px] text-coral"
          role="alert"
        >
          {authError.message}
        </p>
      ) : null}

      <EmailField
        value={values.email}
        error={errors.email}
        disabled={loading}
        onChange={(email) => updateField('email', email)}
      />

      <PasswordField
        value={values.password}
        showPassword={showPassword}
        error={errors.password}
        disabled={loading}
        onChange={(password) => updateField('password', password)}
        onToggleVisibility={() => setShowPassword((current) => !current)}
      />

      <LoginOptions
        keepSignedIn={values.keepSignedIn}
        disabled={loading}
        onKeepSignedInChange={(keepSignedIn) => updateField('keepSignedIn', keepSignedIn)}
        onForgotPassword={handleForgotPassword}
      />

      <div className="pt-1">
        <SignInButton loading={loading} />
      </div>
    </form>
  )
}
