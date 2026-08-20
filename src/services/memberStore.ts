import { initialMembers } from '../data/members'
import type { Member, MemberStatus } from '../types/member'

type Listener = () => void

let members: Member[] = structuredClone(initialMembers)
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

function withStatus(member: Member, status: MemberStatus): Member {
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

export function setMemberStatus(id: string, status: MemberStatus): void {
  members = members.map((m) => (m.id === id ? withStatus(m, status) : m))
  notify()
}

export function softDeleteMember(id: string): void {
  setMemberStatus(id, 'inactive')
}

export function bulkSetMemberStatus(ids: string[], status: MemberStatus): void {
  const idSet = new Set(ids)
  members = members.map((m) => (idSet.has(m.id) ? withStatus(m, status) : m))
  notify()
}

export function bulkSoftDeleteMembers(ids: string[]): void {
  bulkSetMemberStatus(ids, 'inactive')
}
