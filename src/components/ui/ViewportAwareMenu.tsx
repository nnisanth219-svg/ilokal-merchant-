import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

export interface ViewportMenuItem {
  id: string
  label: string
  onClick: () => void
  destructive?: boolean
  dividerBefore?: boolean
}

interface ViewportAwareMenuProps {
  open: boolean
  anchorEl: HTMLElement | null
  items: ViewportMenuItem[]
  onClose: () => void
  width?: number
}

interface MenuCoords {
  top: number
  left: number
  maxHeight: number
  width: number
}

const VIEWPORT_PAD = 8

function computeCoords(
  anchor: DOMRect,
  menuWidth: number,
  estimatedHeight: number,
): MenuCoords {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const effectiveWidth = Math.min(menuWidth, vw - VIEWPORT_PAD * 2)
  const spaceBelow = vh - anchor.bottom - VIEWPORT_PAD
  const spaceAbove = anchor.top - VIEWPORT_PAD
  const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow

  let top = openUp
    ? Math.max(VIEWPORT_PAD, anchor.top - estimatedHeight - 4)
    : anchor.bottom + 4

  let left = anchor.right - effectiveWidth
  if (left < VIEWPORT_PAD) left = VIEWPORT_PAD
  if (left + effectiveWidth > vw - VIEWPORT_PAD) {
    left = Math.max(VIEWPORT_PAD, vw - effectiveWidth - VIEWPORT_PAD)
  }

  const maxHeight = openUp
    ? Math.max(120, anchor.top - VIEWPORT_PAD - 4)
    : Math.max(120, vh - top - VIEWPORT_PAD)

  if (!openUp && top + Math.min(estimatedHeight, maxHeight) > vh - VIEWPORT_PAD) {
    top = Math.max(VIEWPORT_PAD, vh - Math.min(estimatedHeight, maxHeight) - VIEWPORT_PAD)
  }

  return { top, left, maxHeight, width: effectiveWidth }
}

export function ViewportAwareMenu({
  open,
  anchorEl,
  items,
  onClose,
  width = 188,
}: ViewportAwareMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [coords, setCoords] = useState<MenuCoords | null>(null)

  const estimatedHeight = items.reduce((sum, item) => {
    return sum + (item.dividerBefore ? 9 : 0) + 36
  }, 8)

  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setCoords(null)
      return
    }

    function reposition(): void {
      if (!anchorEl) return
      const rect = anchorEl.getBoundingClientRect()
      const measured = menuRef.current?.offsetHeight ?? estimatedHeight
      setCoords(computeCoords(rect, width, measured))
    }

    reposition()
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open, anchorEl, estimatedHeight, width])

  useEffect(() => {
    if (!open) return

    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }

    function onPointer(event: MouseEvent): void {
      const target = event.target as Node
      if (menuRef.current?.contains(target)) return
      if (anchorEl?.contains(target)) return
      onClose()
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open, onClose, anchorEl])

  if (!open || !anchorEl || !coords) return null

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight,
        zIndex: 80,
      }}
      className="overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-[0_12px_28px_rgba(16,43,89,0.16)]"
    >
      {items.map((item) => (
        <div key={item.id}>
          {item.dividerBefore ? <div className="my-1 border-t border-border" /> : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              item.onClick()
              onClose()
            }}
            className={[
              'flex min-h-[40px] w-full items-center px-3.5 py-2.5 text-left text-[13px] transition hover:bg-page',
              item.destructive ? 'font-semibold text-action' : 'text-navy',
            ].join(' ')}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}

interface RowActionButtonProps {
  label: string
  open: boolean
  onToggle: (el: HTMLButtonElement) => void
  children?: ReactNode
}

export function RowActionButton({ label, open, onToggle, children }: RowActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      onClick={(event) => onToggle(event.currentTarget)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-page hover:text-navy"
    >
      {children ?? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      )}
    </button>
  )
}
