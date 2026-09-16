import { useEffect, useRef, useState } from 'react'

export function ColumnPicker<K extends string>({
  columns,
  visible,
  onChange,
}: {
  columns: { key: K; label: string; locked?: boolean }[]
  visible: Record<K, boolean>
  onChange: (key: K, visible: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 min-h-[40px] items-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page"
        aria-expanded={open}
      >
        Columns
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-[220px] rounded-xl border border-border bg-white p-2 shadow-[0_12px_30px_rgba(16,43,89,0.12)]">
          {columns.map((column) => (
            <label
              key={column.key}
              className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg px-2 text-[13px] text-navy hover:bg-page"
            >
              <input
                type="checkbox"
                checked={visible[column.key]}
                disabled={column.locked}
                onChange={(event) => onChange(column.key, event.target.checked)}
                className="h-[14px] w-[14px] accent-navy"
              />
              {column.label}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}
