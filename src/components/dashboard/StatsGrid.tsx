import { useDashboardStats } from '../../hooks/useDashboardData'
import { MetricCard } from './MetricCard'

function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

function formatRevenue(value: number): string {
  return `RM ${value.toLocaleString('en-US')}`
}

export function StatsGrid() {
  const { data, loading, error } = useDashboardStats()

  return (
    <section aria-label="Key metrics" className="flex shrink-0 flex-col gap-3">
      {error ? (
        <p className="rounded-lg border border-coral/20 bg-coral/5 px-3 py-2 text-[13px] text-coral">
          Unable to load statistics
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="ACTIVE MEMBERS"
          value={formatCount(data?.activeMembers ?? 0)}
          trend={data?.activeMembersTrend}
          to="/members"
          loading={loading}
        />
        <MetricCard
          label="LIVE MERCHANTS"
          value={formatCount(data?.liveMerchants ?? 0)}
          trend={data?.liveMerchantsTrend}
          to="/merchants"
          loading={loading}
        />
        <MetricCard
          label="REDEMPTIONS"
          value={formatCount(data?.redemptions ?? 0)}
          trend={data?.redemptionsTrend}
          to="/redemptions"
          loading={loading}
        />
        <MetricCard
          label="MEMBERSHIP REVENUE"
          value={formatRevenue(data?.membershipRevenue ?? 0)}
          variant="highlight"
          secondary={
            data
              ? `Renewal rate ${data.renewalRate}%`
              : loading
                ? null
                : 'Renewal rate 0%'
          }
          to="/subscriptions"
          loading={loading}
        />
      </div>

      {!loading && !error && data?.dataSources.adminUsers === 'available' ? (
        <p className="text-[12px] text-muted">
          Admin accounts in system: {formatCount(data.adminUsersActive)} active /{' '}
          {formatCount(data.adminUsersTotal)} total
        </p>
      ) : null}
    </section>
  )
}
