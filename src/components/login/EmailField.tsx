interface EmailFieldProps {
  value: string
  error?: string
  disabled?: boolean
  onChange: (value: string) => void
}

export function EmailField({ value, error, disabled, onChange }: EmailFieldProps) {
  return (
    <div className="w-full">
      <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-navy">
        Email address<span className="text-coral">*</span>
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'email-error' : undefined}
        className={[
          'h-12 w-full rounded-lg border bg-white px-3.5 text-[14px] text-navy outline-none transition',
          'placeholder:text-muted',
          'focus:border-navy focus:ring-2 focus:ring-navy/15',
          'disabled:cursor-not-allowed disabled:opacity-60',
          error ? 'border-coral' : 'border-border',
        ].join(' ')}
      />
      {error ? (
        <p id="email-error" className="mt-1.5 text-[12px] text-coral" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
