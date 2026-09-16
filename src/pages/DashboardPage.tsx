import { DashboardLowerGrid } from '../components/dashboard/DashboardLowerGrid'
import { StatsGrid } from '../components/dashboard/StatsGrid'
import { TopHeader } from '../components/dashboard/TopHeader'

export function DashboardPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
      <TopHeader />
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex min-h-0 flex-1 flex-col gap-5">
          <StatsGrid />
          <DashboardLowerGrid />
        </div>
      </div>
    </div>
  )
}
