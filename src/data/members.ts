import type { Member, MemberStatus, MembershipPlan } from '../types/member'

function device(deviceName: string, lastActive: string): Member['device'] {
  const ios =
    deviceName.toLowerCase().includes('iphone') || deviceName.toLowerCase().includes('ipad')
  return {
    device: deviceName,
    lastActive,
    appVersion: '2.4.1',
    platform: ios ? 'iOS' : 'Android',
  }
}

function subscription(
  plan: MembershipPlan,
  status: MemberStatus,
  startDate: string,
  validUntil: string,
): Member['subscription'] {
  return {
    plan,
    status,
    startDate,
    validUntil,
    paymentStatus: status === 'active' ? 'Paid' : status === 'expired' ? 'Expired' : 'On hold',
  }
}

const featured: Member[] = [
  {
    id: 'mb-4821',
    memberCode: 'IL-2026-004821',
    fullName: 'Nurul Aisyah',
    email: 'nurul.aisyah@gmail.com',
    phone: '012-334 9821',
    city: 'Petaling Jaya',
    status: 'active',
    plan: 'Annual',
    planLabel: 'Annual',
    joinedAt: '2026-08-12T08:00:00.000Z',
    expiresAt: '2027-08-12T08:00:00.000Z',
    totalPurchases: 2,
    totalRedemptions: 14,
    reviewsCount: 3,
    purchases: [
      {
        id: 'p1',
        date: '2026-08-12T08:00:00.000Z',
        description: 'Annual Membership',
        plan: 'Annual Plan',
        amountLabel: 'RM 199',
        status: 'Paid',
      },
      {
        id: 'p2',
        date: '2025-08-12T08:00:00.000Z',
        description: 'Annual Membership renewal',
        plan: 'Annual Plan',
        amountLabel: 'RM 199',
        status: 'Paid',
      },
    ],
    redemptions: [
      {
        id: 'r1',
        date: '2026-08-11T10:00:00.000Z',
        merchantName: 'Kedai Kopi Seri Wangi',
        offerTitle: '15% off total bill',
        status: 'Redeemed',
      },
      {
        id: 'r2',
        date: '2026-08-07T15:00:00.000Z',
        merchantName: 'Batik Warisan Gallery',
        offerTitle: '10% off selected items',
        status: 'Redeemed',
      },
    ],
    reviews: [
      {
        id: 'rv1',
        merchantName: 'Kedai Kopi Seri Wangi',
        rating: 5,
        text: 'Great coffee and very friendly service.',
        date: '2026-08-11T12:00:00.000Z',
      },
    ],
    device: device('iPhone 15', '2026-08-11T18:00:00.000Z'),
    subscription: subscription('Annual', 'active', '12 Aug 2026', '12 Aug 2027'),
    supportNotes: [
      {
        id: 'n1',
        date: '2026-08-08T09:00:00.000Z',
        note: 'Member contacted support regarding membership renewal.',
        addedBy: 'Aisyah R.',
      },
    ],
  },
  {
    id: 'mb-4822',
    memberCode: 'IL-2026-004822',
    fullName: 'Aqmal Faris',
    email: 'aqmal.faris@gmail.com',
    phone: '013-456 7210',
    city: 'Kuala Lumpur',
    status: 'active',
    plan: 'Monthly',
    planLabel: 'Monthly',
    joinedAt: '2026-08-09T08:00:00.000Z',
    expiresAt: '2026-09-09T08:00:00.000Z',
    totalPurchases: 1,
    totalRedemptions: 5,
    reviewsCount: 1,
    purchases: [
      {
        id: 'p1',
        date: '2026-08-09T08:00:00.000Z',
        description: 'Monthly Membership',
        plan: 'Monthly Plan',
        amountLabel: 'RM 19',
        status: 'Paid',
      },
    ],
    redemptions: [
      {
        id: 'r1',
        date: '2026-08-10T11:00:00.000Z',
        merchantName: 'Ipoh White Coffee Co.',
        offerTitle: 'Free upsize',
        status: 'Redeemed',
      },
    ],
    reviews: [
      {
        id: 'rv1',
        merchantName: 'Ipoh White Coffee Co.',
        rating: 4,
        text: 'Nice ambience, fast service.',
        date: '2026-08-10T12:30:00.000Z',
      },
    ],
    device: device('Samsung Galaxy S24', '2026-08-10T20:00:00.000Z'),
    subscription: subscription('Monthly', 'active', '09 Aug 2026', '09 Sep 2026'),
    supportNotes: [],
  },
  {
    id: 'mb-4823',
    memberCode: 'IL-2026-004823',
    fullName: 'Omar Faisal',
    email: 'omar.faisal@gmail.com',
    phone: '011-289 4421',
    city: 'Shah Alam',
    status: 'active',
    plan: 'Annual',
    planLabel: 'Annual',
    joinedAt: '2026-08-04T08:00:00.000Z',
    expiresAt: '2027-08-04T08:00:00.000Z',
    totalPurchases: 1,
    totalRedemptions: 8,
    reviewsCount: 2,
    purchases: [
      {
        id: 'p1',
        date: '2026-08-04T08:00:00.000Z',
        description: 'Annual Membership',
        plan: 'Annual Plan',
        amountLabel: 'RM 199',
        status: 'Paid',
      },
    ],
    redemptions: [
      {
        id: 'r1',
        date: '2026-08-06T09:00:00.000Z',
        merchantName: 'SoftGlow Studio',
        offerTitle: 'RM20 off spa package',
        status: 'Redeemed',
      },
    ],
    reviews: [
      {
        id: 'rv1',
        merchantName: 'SoftGlow Studio',
        rating: 5,
        text: 'Relaxing session, will return.',
        date: '2026-08-06T14:00:00.000Z',
      },
    ],
    device: device('iPhone 14', '2026-08-12T09:00:00.000Z'),
    subscription: subscription('Annual', 'active', '04 Aug 2026', '04 Aug 2027'),
    supportNotes: [
      {
        id: 'n1',
        date: '2026-08-05T10:00:00.000Z',
        note: 'Welcome call completed. Member confirmed email.',
        addedBy: 'Faiz M.',
      },
    ],
  },
  {
    id: 'mb-4901',
    memberCode: 'IL-2026-004901',
    fullName: 'Tan Wei Ming',
    email: 'weiming.tan@outlook.com',
    phone: '016-284 1177',
    city: 'Subang Jaya',
    status: 'expired',
    plan: 'Monthly',
    planLabel: 'Monthly',
    joinedAt: '2026-01-18T08:00:00.000Z',
    expiresAt: '2026-08-18T08:00:00.000Z',
    totalPurchases: 3,
    totalRedemptions: 9,
    reviewsCount: 1,
    purchases: [
      {
        id: 'p1',
        date: '2026-07-18T08:00:00.000Z',
        description: 'Monthly Membership',
        plan: 'Monthly Plan',
        amountLabel: 'RM 15',
        status: 'Paid',
      },
    ],
    redemptions: [
      {
        id: 'r1',
        date: '2026-08-01T12:00:00.000Z',
        merchantName: 'Urban Climb Studio',
        offerTitle: 'Day pass 20% off',
        status: 'Redeemed',
      },
    ],
    reviews: [],
    device: device('Google Pixel 8', '2026-08-18T08:00:00.000Z'),
    subscription: subscription('Monthly', 'expired', '18 Jul 2026', '18 Aug 2026'),
    supportNotes: [
      {
        id: 'n1',
        date: '2026-08-19T09:00:00.000Z',
        note: 'Membership lapsed. Renewal reminder sent.',
        addedBy: 'System',
      },
    ],
  },
  {
    id: 'mb-4933',
    memberCode: 'IL-2026-004933',
    fullName: 'Arun Kumaran',
    email: 'arun.k@yahoo.com',
    phone: '019-330 8821',
    city: 'George Town',
    status: 'suspended',
    plan: 'Annual',
    planLabel: 'Annual',
    joinedAt: '2025-11-19T08:00:00.000Z',
    expiresAt: '2026-11-19T08:00:00.000Z',
    totalPurchases: 2,
    totalRedemptions: 41,
    reviewsCount: 4,
    purchases: [
      {
        id: 'p1',
        date: '2025-11-19T08:00:00.000Z',
        description: 'Annual Membership',
        plan: 'Annual Plan',
        amountLabel: 'RM 120',
        status: 'Paid',
      },
    ],
    redemptions: [
      {
        id: 'r1',
        date: '2026-07-20T10:00:00.000Z',
        merchantName: 'Heritage Walk Melaka',
        offerTitle: 'Member entry pass',
        status: 'Redeemed',
      },
    ],
    reviews: [
      {
        id: 'rv1',
        merchantName: 'Heritage Walk Melaka',
        rating: 3,
        text: 'Good experience overall.',
        date: '2026-07-20T16:00:00.000Z',
      },
    ],
    device: device('iPhone 13', '2026-08-01T11:00:00.000Z'),
    subscription: subscription('Annual', 'suspended', '19 Nov 2025', '19 Nov 2026'),
    supportNotes: [
      {
        id: 'n1',
        date: '2026-08-02T14:00:00.000Z',
        note: 'Account suspended pending policy review.',
        addedBy: 'Admin · David R.',
      },
    ],
  },
  {
    id: 'mb-4688',
    memberCode: 'IL-2026-004688',
    fullName: 'Siti Liyana',
    email: 'siti.liyana@gmail.com',
    phone: '011-2288 3390',
    city: 'Johor Bahru',
    status: 'inactive',
    plan: 'None',
    planLabel: '—',
    joinedAt: '2026-08-16T08:00:00.000Z',
    expiresAt: null,
    totalPurchases: 0,
    totalRedemptions: 0,
    reviewsCount: 0,
    purchases: [],
    redemptions: [],
    reviews: [],
    device: device('iPhone SE', '2026-08-16T09:00:00.000Z'),
    subscription: subscription('None', 'inactive', '—', '—'),
    supportNotes: [
      {
        id: 'n1',
        date: '2026-08-16T10:00:00.000Z',
        note: 'Registered account. Awaiting first membership purchase.',
        addedBy: 'System',
      },
    ],
  },
]

const EXTRA_NAMES = [
  'Hafizah Ismail',
  'Lee Wei Han',
  'Priya Venkatesh',
  'Chong Mei Ling',
  'Farah Nadia',
  'Marcus Tan',
  'Zainab Rahman',
  'Jason Lim',
  'Bin Omar',
  'Akhmer Rahman',
  'Fasil Ibrahim',
  'Amirul Hakim',
  'Rachel Ong',
  'Kumar Raj',
  'Melissa Ho',
  'Syafiq Azmi',
  'Grace Yap',
  'Irfan Malik',
  'Sofia Chan',
  'Daniel Lim',
] as const

const CITIES = [
  'Petaling Jaya',
  'Kuala Lumpur',
  'Shah Alam',
  'Subang Jaya',
  'George Town',
  'Ipoh',
  'Melaka',
  'Johor Bahru',
  'Klang',
  'Cyberjaya',
] as const

function buildExtraMembers(): Member[] {
  const extras: Member[] = []
  for (let i = 0; i < 40; i += 1) {
    const code = 5000 + i
    const name = EXTRA_NAMES[i % EXTRA_NAMES.length]
    const plan: MembershipPlan = i % 5 === 0 ? 'None' : i % 3 === 0 ? 'Monthly' : 'Annual'
    const statusPool: MemberStatus[] = [
      'active',
      'active',
      'active',
      'active',
      'expired',
      'suspended',
      'inactive',
    ]
    const status = statusPool[i % statusPool.length]
    const joined = new Date(Date.UTC(2026, i % 8, (i % 27) + 1))
    const expires =
      plan === 'None'
        ? null
        : new Date(joined.getTime() + (plan === 'Annual' ? 365 : 30) * 86400000)
    const joinedIso = joined.toISOString()
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    extras.push({
      id: `mb-extra-${code}`,
      memberCode: `IL-2026-00${code}`,
      fullName: i >= EXTRA_NAMES.length ? `${name} ${i + 1}` : name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}.${code}@gmail.com`,
      phone: `01${i % 9}-${100 + (i % 800)} ${2000 + (i % 7000)}`,
      city: CITIES[i % CITIES.length],
      status,
      plan,
      planLabel: plan === 'None' ? '—' : plan,
      joinedAt: joinedIso,
      expiresAt: expires?.toISOString() ?? null,
      totalPurchases: plan === 'None' ? 0 : 1 + (i % 3),
      totalRedemptions: i % 20,
      reviewsCount: i % 4,
      purchases:
        plan === 'None'
          ? []
          : [
              {
                id: `p-${code}`,
                date: joinedIso,
                description: `${plan} Membership`,
                plan: `${plan} Plan`,
                amountLabel: plan === 'Annual' ? 'RM 199' : 'RM 19',
                status: 'Paid',
              },
            ],
      redemptions:
        i % 3 === 0
          ? []
          : [
              {
                id: `r-${code}`,
                date: joinedIso,
                merchantName: 'Kedai Kopi Seri Wangi',
                offerTitle: '15% off total bill',
                status: 'Redeemed',
              },
            ],
      reviews:
        i % 4 === 0
          ? [
              {
                id: `rv-${code}`,
                merchantName: 'Batik Warisan Gallery',
                rating: 3 + (i % 3),
                text: 'Pleasant visit, good staff.',
                date: joinedIso,
              },
            ]
          : [],
      device: device(i % 2 === 0 ? 'iPhone 14' : 'Samsung A54', joinedIso),
      subscription: subscription(plan, status, fmt(joined), expires ? fmt(expires) : '—'),
      supportNotes: [],
    })
  }
  return extras
}

export const initialMembers: Member[] = [...featured, ...buildExtraMembers()]

/** Display-only headline counts for list UI. */
export const MEMBER_LIST_DISPLAY = {
  totalLabel: '1,284',
} as const
