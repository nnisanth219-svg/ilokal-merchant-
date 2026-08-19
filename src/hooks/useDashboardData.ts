import { useCallback, useEffect, useState } from 'react'
import {
  getDashboardActivity,
  getDashboardRedemptions,
  getDashboardStats,
} from '../services/dashboardApi'
import type {
  DashboardActivityItem,
  DashboardChartData,
  DashboardStats,
} from '../types/dashboard'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function useAsyncResource<T>(loader: () => Promise<T>): AsyncState<T> & { reload: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await loader()
        if (active) {
          setData(result)
        }
      } catch (err) {
        if (active) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Unable to load data')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [loader, reloadKey])

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1)
  }, [])

  return { data, loading, error, reload }
}

export function useDashboardStats() {
  const loader = useCallback(() => getDashboardStats(), [])
  return useAsyncResource<DashboardStats>(loader)
}

export function useDashboardChart() {
  const loader = useCallback(() => getDashboardRedemptions(), [])
  return useAsyncResource<DashboardChartData>(loader)
}

export function useDashboardActivity() {
  const loader = useCallback(() => getDashboardActivity(), [])
  return useAsyncResource<DashboardActivityItem[]>(loader)
}
