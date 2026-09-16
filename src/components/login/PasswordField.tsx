interface PasswordFieldProps {
  value: string
  showPassword: boolean
  error?: string
  disabled?: boolean
  onChange: (value: string) => void
  onToggleVisibility: () => void
}

export function PasswordField({
  value,
  showPassword,
  error,
  disabled,
  onChange,
  onToggleVisibility,
}: PasswordFieldProps) {
  return (
    <div className="w-full">
      <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-navy">
        Password<span className="text-coral">*</span>
      </label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'password-error' : undefined}
          className={[
            'h-12 w-full rounded-lg border bg-white py-2 pl-3.5 pr-14 text-[14px] text-navy outline-none transition',
            'focus:border-navy focus:ring-2 focus:ring-navy/20',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-coral' : 'border-border',
          ].join(' ')}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          className="absolute right-1 top-1/2 inline-flex h-10 min-w-[44px] -translate-y-1/2 items-center justify-center px-2 text-[13px] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 disabled:opacity-60"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      {error ? (
        <p id="password-error" className="mt-1.5 text-[12px] text-coral" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
