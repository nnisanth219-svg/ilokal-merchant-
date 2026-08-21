import { initialAuditLogs } from '../data/auditLogs'
import type { AuditLogEntry } from '../types/auditLog'

type Listener = () => void

let entries: AuditLogEntry[] = structuredClone(initialAuditLogs)
const listeners = new Set<Listener>()

export function subscribeAuditLogs(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAuditLogs(): AuditLogEntry[] {
  return entries
}

export function getAuditLogById(id: string): AuditLogEntry | undefined {
  return entries.find((e) => e.id === id)
}
