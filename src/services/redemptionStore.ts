import { initialRedemptions } from '../data/redemptions'
import type { Redemption } from '../types/redemption'

type Listener = () => void

let redemptions: Redemption[] = structuredClone(initialRedemptions)
const listeners = new Set<Listener>()

export function subscribeRedemptions(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getRedemptions(): Redemption[] {
  return redemptions
}

export function getRedemptionById(id: string): Redemption | undefined {
  return redemptions.find((r) => r.id === id)
}
