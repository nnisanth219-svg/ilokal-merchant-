import type { Subscription } from '../types/subscription'

const names = [
  ['Nurul Aisyah', 'nurul.aisyah@email.com', '+60 12-345 6789', 'MEM-100421'],
  ['Aqmal Faris', 'aqmal.faris@email.com', '+60 13-221 8841', 'MEM-100522'],
  ['Omar Faisal', 'omar.faisal@email.com', '+60 17-908 2210', 'MEM-100633'],
  ['Siti Rahmah', 'siti.rahmah@email.com', '+60 11-556 9021', 'MEM-100744'],
  ['Daniel Wong', 'daniel.wong@email.com', '+60 16-778 4412', 'MEM-100855'],
  ['Priya Nair', 'priya.nair@email.com', '+60 19-334 6678', 'MEM-100966'],
  ['Hafiz Rahman', 'hafiz.rahman@email.com', '+60 12-889 3344', 'MEM-101077'],
  ['Mei Ling Tan', 'meiling.tan@email.com', '+60 14-220 1188', 'MEM-101188'],
  ['Rajesh Kumar', 'rajesh.kumar@email.com', '+60 18-667 2299', 'MEM-101299'],
  ['Amira Hassan', 'amira.hassan@email.com', '+60 13-445 7788', 'MEM-101310'],
] as const

function buildSubscriptions(): Subscription[] {
  const list: Subscription[] = []
  const statuses: Subscription['status'][] = ['active', 'expired', 'suspended', 'active', 'active']
  const plans: Subscription['plan'][] = ['Annual', 'Monthly', 'Annual', 'Monthly', 'Annual']

  for (let i = 0; i < 32; i++) {
    const person = names[i % names.length]
    const plan = plans[i % plans.length]
    const status = statuses[i % statuses.length]
    const year = 2025 + (i % 2)
    const month = String((i % 12) + 1).padStart(2, '0')
    const day = String((i % 27) + 1).padStart(2, '0')
    const start = `${year}-${month}-${day}`
    const expiryYear = plan === 'Annual' ? year + 1 : year
    const expiryMonth =
      plan === 'Monthly'
        ? String(((i % 12) + 2 > 12 ? (i % 12) + 2 - 12 : (i % 12) + 2)).padStart(2, '0')
        : month
    const expiry = `${plan === 'Annual' ? expiryYear : expiryMonth === '01' && plan === 'Monthly' && (i % 12) + 1 === 12 ? year + 1 : year}-${plan === 'Annual' ? month : expiryMonth}-${day}`
    const codeNum = String(4821 + i).padStart(6, '0')

    list.push({
      id: `sub-${String(i + 1).padStart(4, '0')}`,
      subscriptionCode: `SUB-2026-${codeNum}`,
      memberId: `mem-${String((i % 10) + 1).padStart(4, '0')}`,
      memberName: person[0],
      memberEmail: person[1],
      memberPhone: person[2],
      memberCode: person[3],
      plan,
      billing: plan,
      startDate: start,
      expiryDate: expiry,
      status,
      payments: [
        {
          id: `pay-${i}-1`,
          reference: `TXN-IL-${900100 + i}`,
          paidAt: start,
          amountLabel: plan === 'Annual' ? 'RM 149.00' : 'RM 18.90',
          status: status === 'expired' ? 'Failed' : 'Paid',
        },
        ...(i % 3 === 0
          ? [
              {
                id: `pay-${i}-2`,
                reference: `TXN-IL-${800100 + i}`,
                paidAt: `${year - 1}-${month}-${day}`,
                amountLabel: plan === 'Annual' ? 'RM 149.00' : 'RM 18.90',
                status: 'Paid' as const,
              },
            ]
          : []),
      ],
    })
  }

  // Featured realistic row matching the brief
  list[0] = {
    ...list[0],
    id: 'sub-0001',
    subscriptionCode: 'SUB-2026-004821',
    memberName: 'Nurul Aisyah',
    memberEmail: 'nurul.aisyah@email.com',
    memberPhone: '+60 12-345 6789',
    memberCode: 'MEM-100421',
    memberId: 'mem-0001',
    plan: 'Annual',
    billing: 'Annual',
    startDate: '2026-08-12',
    expiryDate: '2027-08-12',
    status: 'active',
    payments: [
      {
        id: 'pay-0-1',
        reference: 'TXN-IL-904821',
        paidAt: '2026-08-12',
        amountLabel: 'RM 149.00',
        status: 'Paid',
      },
    ],
  }

  return list
}

export const initialSubscriptions: Subscription[] = buildSubscriptions()

export const SUBSCRIPTION_SUMMARY = {
  total: 1284,
  active: 976,
  expiringSoon: 34,
  expired: 142,
} as const
