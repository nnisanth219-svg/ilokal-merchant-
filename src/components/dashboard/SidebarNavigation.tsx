import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSidebarOptional } from '../../context/SidebarContext'
import { sidebarNavItems } from '../../data/dashboard'
import { canViewModule } from '../../types/auth'

const NAV_MODULE: Record<string, string> = {
  dashboard: 'Dashboard',
  merchants: 'Merchants',
  offers: 'Offers',
  members: 'Members',
  subscriptions: 'Subscriptions',
  redemptions: 'Redemptions',
  reviews: 'Reviews',
  categories: 'Categories',
  'admin-users': 'Admin Users',
  settings: 'Settings',
  'audit-log': 'Audit Log',
}

export function SidebarNavigation() {
  const sidebar = useSidebarOptional()
  const { user } = useAuth()

  const items = sidebarNavItems.filter((item) => {
    const module = NAV_MODULE[item.id]
    return module ? canViewModule(user, module) : true
  })

  return (
    <nav aria-label="Main navigation" className="mt-6 min-h-0 flex-1 overflow-y-auto px-3 pb-2">
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="w-full">
            <NavLink
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={() => sidebar?.closeSidebar()}
              className={({ isActive }) =>
                [
                  'flex min-h-[44px] w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                  isActive
                    ? 'bg-navy-active font-semibold text-white'
                    : 'font-medium text-[#9EB0C7] hover:bg-white/5 hover:text-white',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
