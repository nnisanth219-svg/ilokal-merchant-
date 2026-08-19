import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'

interface SidebarContextValue {
  open: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext)
  if (!ctx) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return ctx
}

export function useSidebarOptional(): SidebarContextValue | null {
  return useContext(SidebarContext)
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const openSidebar = useCallback(() => setOpen(true), [])
  const closeSidebar = useCallback(() => setOpen(false), [])
  const toggleSidebar = useCallback(() => setOpen((v) => !v), [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const value = useMemo(
    () => ({ open, openSidebar, closeSidebar, toggleSidebar }),
    [open, openSidebar, closeSidebar, toggleSidebar],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}
