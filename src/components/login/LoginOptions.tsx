interface LoginOptionsProps {
  keepSignedIn: boolean
  disabled?: boolean
  onKeepSignedInChange: (checked: boolean) => void
  onForgotPassword: () => void
}

export function LoginOptions({
  keepSignedIn,
  disabled,
  onKeepSignedInChange,
  onForgotPassword,
}: LoginOptionsProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <label className="flex cursor-pointer items-center gap-2 select-none">
        <span className="relative inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={keepSignedIn}
            disabled={disabled}
            onChange={(event) => onKeepSignedInChange(event.target.checked)}
            className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            aria-label="Keep me signed in"
          />
          <span
            className={[
              'pointer-events-none flex h-[16px] w-[16px] items-center justify-center rounded-[3px] border transition',
              keepSignedIn
                ? 'border-navy bg-navy'
                : 'border-border bg-white',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-navy/25',
            ].join(' ')}
            aria-hidden="true"
          >
            {keepSignedIn ? (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M1.5 4L3.8 6.3L8.5 1.5"
                  stroke="#F7B718"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
        </span>
        <span className="text-[13px] text-navy">Keep me signed in</span>
      </label>

      <button
        type="button"
        onClick={onForgotPassword}
        disabled={disabled}
        className="inline-flex min-h-[40px] items-center text-[13px] font-medium text-coral-link transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/30 disabled:opacity-60"
      >
        Forgot password?
      </button>
    </div>
  )
}
