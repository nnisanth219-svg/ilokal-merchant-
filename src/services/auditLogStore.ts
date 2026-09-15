import type { AuditLogEntry } from '../types/auditLog'

/**
 * Legacy in-memory store — Audit Log UI now uses auditLogApi / PostgreSQL.
 * Kept only so older imports do not break; do not wire pages to this.
 */

type Listener = () => void

let entries: AuditLogEntry[] = []
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
