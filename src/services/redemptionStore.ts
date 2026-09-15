import type { Redemption } from '../types/redemption'

/**
 * Legacy in-memory store — Redemptions UI now uses redemptionApi / PostgreSQL.
 * Kept only so older imports do not break; do not wire pages to this.
 */

type Listener = () => void

let redemptions: Redemption[] = []
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
