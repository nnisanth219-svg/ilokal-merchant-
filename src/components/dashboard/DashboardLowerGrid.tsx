import { AttentionPanel } from './AttentionPanel'
import { RedemptionsChart } from './RedemptionsChart'

export function DashboardLowerGrid() {
  return (
    <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.85fr_1fr] lg:items-stretch">
      <RedemptionsChart />
      <AttentionPanel />
    </section>
  )
}
