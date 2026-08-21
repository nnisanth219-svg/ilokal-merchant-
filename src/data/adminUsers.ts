import type {
  AdminUser,
  PermissionAction,
  PermissionModule,
  RolePermissionMatrix,
} from '../types/adminUser'
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from '../types/adminUser'

function allPermissions(): Record<PermissionModule, PermissionAction[]> {
  return Object.fromEntries(
    PERMISSION_MODULES.map((m) => [m, [...PERMISSION_ACTIONS]]),
  ) as Record<PermissionModule, PermissionAction[]>
}

function subset(
  modules: Partial<Record<PermissionModule, PermissionAction[]>>,
): Record<PermissionModule, PermissionAction[]> {
  const base = Object.fromEntries(
    PERMISSION_MODULES.map((m) => [m, [] as PermissionAction[]]),
  ) as Record<PermissionModule, PermissionAction[]>
  for (const [key, value] of Object.entries(modules)) {
    base[key as PermissionModule] = value ?? []
  }
  return base
}

export const initialAdminUsers: AdminUser[] = [
  {
    id: 'adm-001',
    fullName: 'Aisyah Rahman',
    email: 'aisyah@ilokal.my',
    role: 'Super Admin',
    status: 'active',
    lastActiveLabel: 'Today',
    createdAt: '2025-01-12',
  },
  {
    id: 'adm-002',
    fullName: 'Faiz Mohammed',
    email: 'faiz@ilokal.my',
    role: 'Admin',
    status: 'active',
    lastActiveLabel: 'Today',
    createdAt: '2025-03-04',
  },
  {
    id: 'adm-003',
    fullName: 'Nurul Huda',
    email: 'nurul@ilokal.my',
    role: 'Operations',
    status: 'active',
    lastActiveLabel: 'Yesterday',
    createdAt: '2025-05-18',
  },
  {
    id: 'adm-004',
    fullName: 'Daniel Lim',
    email: 'daniel@ilokal.my',
    role: 'Admin',
    status: 'pending',
    lastActiveLabel: 'Invitation pending',
    createdAt: '2026-08-10',
  },
  {
    id: 'adm-005',
    fullName: 'Siti Aminah',
    email: 'siti@ilokal.my',
    role: 'Operations',
    status: 'active',
    lastActiveLabel: '2 days ago',
    createdAt: '2025-08-22',
  },
  {
    id: 'adm-006',
    fullName: 'Jason Tan',
    email: 'jason@ilokal.my',
    role: 'Admin',
    status: 'inactive',
    lastActiveLabel: '12 days ago',
    createdAt: '2025-02-09',
  },
  {
    id: 'adm-007',
    fullName: 'Mei Ling Chong',
    email: 'meiling@ilokal.my',
    role: 'Operations',
    status: 'active',
    lastActiveLabel: 'Today',
    createdAt: '2026-01-15',
  },
  {
    id: 'adm-008',
    fullName: 'Hafiz Rahman',
    email: 'hafiz@ilokal.my',
    role: 'Admin',
    status: 'active',
    lastActiveLabel: '3 days ago',
    createdAt: '2025-11-02',
  },
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `adm-${String(9 + i).padStart(3, '0')}`,
    fullName: `Admin User ${i + 1}`,
    email: `admin${i + 1}@ilokal.my`,
    role: (['Admin', 'Operations', 'Admin'] as const)[i % 3],
    status: (['active', 'active', 'pending', 'inactive'] as const)[i % 4],
    lastActiveLabel: i % 4 === 2 ? 'Invitation pending' : `${(i % 7) + 1} days ago`,
    createdAt: `2026-0${(i % 8) + 1}-${String((i % 27) + 1).padStart(2, '0')}`,
  })),
]

export const rolePermissionMatrices: RolePermissionMatrix[] = [
  {
    role: 'Super Admin',
    description: 'Full platform access across every module and configuration.',
    permissions: allPermissions(),
  },
  {
    role: 'Admin',
    description: 'Day-to-day CMS management without platform-wide security controls.',
    permissions: subset({
      Dashboard: ['view'],
      Members: ['view', 'create', 'edit'],
      Merchants: ['view', 'create', 'edit', 'manage'],
      Offers: ['view', 'create', 'edit', 'delete'],
      Subscriptions: ['view', 'edit'],
      Redemptions: ['view'],
      Reviews: ['view', 'edit', 'manage'],
      Categories: ['view', 'create', 'edit'],
      'Admin Users': ['view'],
      Settings: ['view'],
      'Audit Log': ['view'],
    }),
  },
  {
    role: 'Operations',
    description: 'Operational monitoring focused on merchants, offers and redemptions.',
    permissions: subset({
      Dashboard: ['view'],
      Members: ['view'],
      Merchants: ['view', 'edit'],
      Offers: ['view', 'edit'],
      Subscriptions: ['view'],
      Redemptions: ['view'],
      Reviews: ['view', 'edit'],
      Categories: ['view'],
      'Admin Users': [],
      Settings: [],
      'Audit Log': ['view'],
    }),
  },
]

export const ADMIN_USERS_SUMMARY = {
  total: 28,
  active: 21,
  pending: 4,
  inactive: 3,
} as const
