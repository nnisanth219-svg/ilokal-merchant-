import { useState } from 'react'
import type { AuthErrorState } from '../types/auth'
import { LoginCard } from '../components/login/LoginCard'

export function LoginPage() {
  const [authError, setAuthError] = useState<AuthErrorState | null>(null)

  return (
    <main className="min-h-dvh w-full overflow-x-hidden bg-white md:h-dvh md:overflow-hidden">
      <LoginCard
        authError={authError}
        onAuthError={setAuthError}
        onAuthErrorClear={() => setAuthError(null)}
      />
    </main>
  )
}
