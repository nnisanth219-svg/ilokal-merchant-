import { initialSettings } from '../data/settings'
import type { AppSettingsState } from '../types/settings'

type Listener = () => void

let settings: AppSettingsState = structuredClone(initialSettings)
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

export function getSettings(): AppSettingsState {
  return settings
}

export function updateSettings(next: AppSettingsState): void {
  settings = structuredClone(next)
  notify()
}
