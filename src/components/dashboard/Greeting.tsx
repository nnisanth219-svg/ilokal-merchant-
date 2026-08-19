import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function getGreetingPeriod(date: Date): string {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Good night'
}

function formatDashboardDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getDisplayName(name?: string, email?: string): string {
  const trimmedName = name?.trim()
  if (trimmedName) {
    return trimmedName.split(/\s+/)[0] ?? trimmedName
  }

  const emailLocalPart = email?.trim().split('@')[0]
  if (emailLocalPart) {
    return emailLocalPart
  }

  return 'Admin'
}

function getLocalClockParts(date: Date): { greeting: string; formattedDate: string } {
  return {
    greeting: getGreetingPeriod(date),
    formattedDate: formatDashboardDate(date),
  }
}

export function Greeting() {
  const { user } = useAuth()
  const [clock, setClock] = useState(() => getLocalClockParts(new Date()))

  useEffect(() => {
    const updateClock = () => {
      setClock(getLocalClockParts(new Date()))
    }

    updateClock()

    const intervalId = window.setInterval(updateClock, 60_000)

    const now = new Date()
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    const timeoutId = window.setTimeout(() => {
      updateClock()
    }, msUntilNextMinute)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [])

  const displayName = getDisplayName(user?.name, user?.email)

  return (
    <div className="min-w-0">
      <h1 className="truncate text-[16px] font-bold leading-tight text-navy sm:text-[18px]">
        {clock.greeting}, {displayName}
      </h1>
      <p className="mt-0.5 truncate text-[12px] text-muted sm:text-[13px]">{clock.formattedDate}</p>
    </div>
  )
}
