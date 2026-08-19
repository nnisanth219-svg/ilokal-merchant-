interface SignInButtonProps {
  loading: boolean
  disabled?: boolean
}

export function SignInButton({ loading, disabled }: SignInButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={[
        'flex h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-navy text-[15px] font-semibold text-white transition',
        'hover:bg-[#0d2449]',
        'active:bg-[#0b1f3f]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/35 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:bg-navy/55 disabled:hover:bg-navy/55',
      ].join(' ')}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
          <span>Signing in…</span>
        </>
      ) : (
        'Sign in'
      )}
    </button>
  )
}
