import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'SA'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}

function formatRole(role: string): string {
  if (role === 'SUPER_ADMIN') return 'Super Admin'
  return role
}

export function SidebarUser() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const displayName = user?.name ?? 'David R.'
  const roleLabel = formatRole(user?.role ?? 'SUPER_ADMIN')

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="border-t border-white/10 px-4 py-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-[12px] font-bold text-navy"
          aria-hidden="true"
        >
          {getInitials(displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-white">{displayName}</p>
          <p className="truncate text-[12px] text-[#9EB0C7]">{roleLabel}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-3 w-full rounded-lg border border-white/15 px-3 py-2 text-left text-[13px] font-medium text-[#9EB0C7] transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loggingOut ? 'Signing out…' : 'Log out'}
      </button>
    </div>
  )
}
