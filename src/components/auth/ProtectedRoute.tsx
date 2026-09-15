import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canViewModule } from '../../types/auth'
import { UnauthorizedPage, moduleForPath } from './UnauthorizedPage'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page text-[14px] text-muted">
        Checking session…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function PermissionRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const module = moduleForPath(location.pathname)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[14px] text-muted">
        Checking permissions…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (module && !canViewModule(user, module)) {
    return <UnauthorizedPage />
  }

  return <Outlet />
}
