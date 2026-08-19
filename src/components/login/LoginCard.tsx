import type { AuthErrorState } from '../../types/auth'
import { BrandPanel } from './BrandPanel'
import { LoginPanel } from './LoginPanel'

interface LoginCardProps {
  authError?: AuthErrorState | null
  onAuthError?: (error: AuthErrorState | null) => void
  onAuthErrorClear?: () => void
}

export function LoginCard({
  authError = null,
  onAuthError,
  onAuthErrorClear,
}: LoginCardProps) {
  return (
    <div className="flex min-h-screen w-full flex-col md:h-full md:min-h-0 md:flex-row">
      <BrandPanel />
      <LoginPanel
        authError={authError}
        onAuthError={onAuthError}
        onAuthErrorClear={onAuthErrorClear}
      />
    </div>
  )
}
