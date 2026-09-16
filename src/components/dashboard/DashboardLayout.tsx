import { Outlet } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '../../context/SidebarContext'
import { Sidebar } from './Sidebar'

function MobileNavBar() {
  const { openSidebar } = useSidebar()

  return (
    <div className="flex min-h-12 shrink-0 items-center gap-3 border-b border-border bg-white px-4 pt-[env(safe-area-inset-top)] lg:hidden">
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={openSidebar}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <span className="text-[14px] font-bold tracking-[-0.02em] text-navy">iLokal</span>
    </div>
  )
}

function LayoutShell() {
  const { open, closeSidebar } = useSidebar()

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-page">
      {open ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-navy/40 lg:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
        <MobileNavBar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <LayoutShell />
    </SidebarProvider>
  )
}
