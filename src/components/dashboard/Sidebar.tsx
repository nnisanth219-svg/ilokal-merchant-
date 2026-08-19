import { useSidebar } from '../../context/SidebarContext'
import { SidebarLogo } from './SidebarLogo'
import { SidebarNavigation } from './SidebarNavigation'
import { SidebarUser } from './SidebarUser'

export function Sidebar() {
  const { open, closeSidebar } = useSidebar()

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-50 flex h-screen w-[230px] shrink-0 flex-col bg-navy transition-transform duration-200 ease-out',
        'lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ].join(' ')}
      aria-label="Main sidebar"
    >
      <div className="flex items-center justify-between shrink-0 pr-2 lg:pr-0">
        <div className="min-w-0 flex-1">
          <SidebarLogo />
        </div>
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
          className="mr-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <SidebarNavigation />
      <div className="shrink-0">
        <SidebarUser />
      </div>
    </aside>
  )
}
