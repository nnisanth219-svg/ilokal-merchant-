import type { Member, MemberStatus } from '../types/member'

/**
 * Legacy in-memory store — Members UI now uses memberApi / PostgreSQL.
 * Kept only so older imports do not break; do not wire pages to this.
 */

type Listener = () => void

let members: Member[] = []
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

function withStatus(member: Member, status: Exclude<MemberStatus, 'deleted'>): Member {
  return {
    ...member,
    status,
    subscription: {
      ...member.subscription,
      status,
      paymentStatus:
        status === 'active' ? 'Paid' : status === 'expired' ? 'Expired' : 'On hold',
    },
  }
}

export function subscribeMembers(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getMembers(): Member[] {
  return members
}

export function getMemberById(id: string): Member | undefined {
  return members.find((m) => m.id === id)
}

export function setMemberStatus(id: string, status: Exclude<MemberStatus, 'deleted'>): void {
  members = members.map((m) => (m.id === id ? withStatus(m, status) : m))
  notify()
}

export function softDeleteMember(id: string): void {
  setMemberStatus(id, 'inactive')
}

export function bulkSetMemberStatus(
  ids: string[],
  status: Exclude<MemberStatus, 'deleted'>,
): void {
  const idSet = new Set(ids)
  members = members.map((m) => (idSet.has(m.id) ? withStatus(m, status) : m))
  notify()
}

export function bulkSoftDeleteMembers(ids: string[]): void {
  bulkSetMemberStatus(ids, 'inactive')
}
