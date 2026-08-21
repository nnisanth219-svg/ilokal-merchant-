import { initialAdminUsers, rolePermissionMatrices } from '../data/adminUsers'
import type {
  AdminRole,
  AdminUser,
  AdminUserStatus,
  RolePermissionMatrix,
} from '../types/adminUser'

type Listener = () => void

let users: AdminUser[] = structuredClone(initialAdminUsers)
let matrices: RolePermissionMatrix[] = structuredClone(rolePermissionMatrices)
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((l) => l())
}

export function subscribeAdminUsers(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAdminUsers(): AdminUser[] {
  return users
}

export function getAdminUserById(id: string): AdminUser | undefined {
  return users.find((u) => u.id === id)
}

export function getRoleMatrices(): RolePermissionMatrix[] {
  return matrices
}

export function inviteAdminUser(input: {
  fullName: string
  email: string
  role: AdminRole
}): AdminUser {
  const created: AdminUser = {
    id: `adm-${Date.now()}`,
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    status: 'pending',
    lastActiveLabel: 'Invitation pending',
    createdAt: new Date().toISOString().slice(0, 10),
  }
  users = [created, ...users]
  notify()
  return created
}

export function updateAdminUser(
  id: string,
  patch: Partial<Pick<AdminUser, 'fullName' | 'email' | 'role' | 'status'>>,
): AdminUser | undefined {
  let updated: AdminUser | undefined
  users = users.map((u) => {
    if (u.id !== id) return u
    updated = { ...u, ...patch }
    return updated
  })
  notify()
  return updated
}

export function setAdminUserStatus(id: string, status: AdminUserStatus): void {
  users = users.map((u) => (u.id === id ? { ...u, status } : u))
  notify()
}

export function bulkSetAdminUserStatus(ids: string[], status: AdminUserStatus): void {
  const idSet = new Set(ids)
  users = users.map((u) => (idSet.has(u.id) ? { ...u, status } : u))
  notify()
}

export function deleteAdminUser(id: string): void {
  users = users.filter((u) => u.id !== id)
  notify()
}

export function bulkDeleteAdminUsers(ids: string[]): void {
  const idSet = new Set(ids)
  users = users.filter((u) => !idSet.has(u.id))
  notify()
}

export function countUsersByRole(role: AdminRole): number {
  return users.filter((u) => u.role === role).length
}
