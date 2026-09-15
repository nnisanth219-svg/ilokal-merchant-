import type { AppSettingsState } from '../types/settings'

/**
 * Legacy in-memory store — Settings UI now uses settingsApi / PostgreSQL.
 * Kept only so older imports do not break; do not wire pages to this.
 */

type Listener = () => void

let settings: AppSettingsState | null = null
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((l) => l())
}

export function subscribeSettings(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSettings(): AppSettingsState | null {
  return settings
}

export function updateSettings(next: AppSettingsState): void {
  settings = structuredClone(next)
  notify()
}
