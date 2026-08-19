import type { AuthErrorState } from '../../types/auth'
import { LoginForm } from './LoginForm'
import { LoginHeading } from './LoginHeading'
import { PortalLabel } from './PortalLabel'

interface LoginPanelProps {
  authError?: AuthErrorState | null
  onAuthError?: (error: AuthErrorState | null) => void
  onAuthErrorClear?: () => void
}

export function LoginPanel({
  authError = null,
  onAuthError,
  onAuthErrorClear,
}: LoginPanelProps) {
  return (
    <section className="flex h-full w-full flex-col justify-center bg-white px-5 py-10 sm:px-12 sm:py-12 md:w-[42%] lg:w-[38%] lg:px-16 xl:px-20">
      <div className="mx-auto w-full max-w-[320px] md:mx-0">
        <PortalLabel />
        <LoginHeading />
        <LoginForm
          authError={authError}
          onAuthError={onAuthError}
          onAuthErrorClear={onAuthErrorClear}
        />
      </div>
    </section>
  )
}
