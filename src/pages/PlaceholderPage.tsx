import { useLocation } from 'react-router-dom'

export function PlaceholderPage() {
  const { pathname } = useLocation()
  const title = pathname
    .replace(/^\//, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-[22px] font-bold text-navy">{title || 'Page'}</h1>
        <p className="mt-2 text-[14px] text-muted">
          This screen will be implemented later.
        </p>
      </div>
    </div>
  )
}
