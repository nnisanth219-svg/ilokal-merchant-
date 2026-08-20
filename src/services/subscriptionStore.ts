import { initialSubscriptions } from '../data/subscriptions'
import type { Subscription, SubscriptionStatus } from '../types/subscription'

type Listener = () => void

let subscriptions: Subscription[] = structuredClone(initialSubscriptions)
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((l) => l())
}

export function subscribeSubscriptions(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSubscriptions(): Subscription[] {
  return subscriptions
}

export function getSubscriptionById(id: string): Subscription | undefined {
  return subscriptions.find((s) => s.id === id)
}

export function setSubscriptionStatus(id: string, status: SubscriptionStatus): void {
  subscriptions = subscriptions.map((s) => (s.id === id ? { ...s, status } : s))
  notify()
}

export function bulkSetSubscriptionStatus(ids: string[], status: SubscriptionStatus): void {
  const idSet = new Set(ids)
  subscriptions = subscriptions.map((s) => (idSet.has(s.id) ? { ...s, status } : s))
  notify()
}

export function renewSubscription(id: string): void {
  subscriptions = subscriptions.map((s) => {
    if (s.id !== id) return s
    const base = new Date(s.expiryDate)
    if (Number.isNaN(base.getTime())) return { ...s, status: 'active' }
    if (s.plan === 'Annual') base.setFullYear(base.getFullYear() + 1)
    else base.setMonth(base.getMonth() + 1)
    return {
      ...s,
      status: 'active',
      expiryDate: base.toISOString().slice(0, 10),
    }
  })
  notify()
}
