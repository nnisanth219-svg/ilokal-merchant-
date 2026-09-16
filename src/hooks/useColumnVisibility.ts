import { useCallback, useMemo, useState } from 'react'

export function useColumnVisibility<K extends string>(
  storageKey: string,
  defaults: Record<K, boolean>,
) {
  const [visible, setVisible] = useState<Record<K, boolean>>(() => {
    if (typeof window === 'undefined') return defaults
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return defaults
      const parsed = JSON.parse(raw) as Partial<Record<K, boolean>>
      return { ...defaults, ...parsed }
    } catch {
      return defaults
    }
  })

  const setColumnVisible = useCallback(
    (key: K, next: boolean) => {
      setVisible((current) => {
        const updated = { ...current, [key]: next }
        const anyVisible = Object.values(updated).some(Boolean)
        const resolved = anyVisible ? updated : current
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(resolved))
        } catch {
          // Ignore quota / private-mode failures.
        }
        return resolved
      })
    },
    [storageKey],
  )

  return useMemo(
    () => ({ visible, setColumnVisible }),
    [visible, setColumnVisible],
  )
}
