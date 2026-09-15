import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canViewModule } from '../../types/auth'

const PATH_MODULE: Array<{ prefix: string; module: string }> = [
  { prefix: '/dashboard', module: 'Dashboard' },
  { prefix: '/merchants', module: 'Merchants' },
  { prefix: '/offers', module: 'Offers' },
  { prefix: '/members', module: 'Members' },
  { prefix: '/subscriptions', module: 'Subscriptions' },
  { prefix: '/redemptions', module: 'Redemptions' },
  { prefix: '/reviews', module: 'Reviews' },
  { prefix: '/categories', module: 'Categories' },
  { prefix: '/admin-users', module: 'Admin Users' },
  { prefix: '/settings', module: 'Settings' },
  { prefix: '/audit-log', module: 'Audit Log' },
]

export function moduleForPath(pathname: string): string | null {
  const match = PATH_MODULE.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))
  return match?.module ?? null
}

export function firstAllowedPath(user: ReturnType<typeof useAuth>['user']): string {
  for (const item of PATH_MODULE) {
    if (canViewModule(user, item.module)) return item.prefix
  }
  return '/login'
}

export function UnauthorizedPage() {
  const { user } = useAuth()
  const home = firstAllowedPath(user)

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">403</p>
        <h1 className="mt-2 text-[22px] font-bold text-navy">Access denied</h1>
        <p className="mt-2 text-[13px] text-muted">
          Your role does not include permission to view this page. Contact a Super Admin if you
          need access.
        </p>
        <Link
          to={home}
          className="mt-5 inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white hover:bg-navy-secondary"
        >
          Go to available page
        </Link>
      </div>
    </div>
  )
}
