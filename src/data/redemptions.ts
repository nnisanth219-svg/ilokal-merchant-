import type { Redemption } from '../types/redemption'

const members = [
  'Nurul Aisyah',
  'Aqmal Faris',
  'Omar Faisal',
  'Siti Rahmah',
  'Daniel Wong',
  'Priya Nair',
  'Hafiz Rahman',
  'Mei Ling Tan',
]
const merchants = [
  'Kedai Kopi Anika',
  'Kedai Kopi Seri Wangi',
  'Batik Warisan Gallery',
  'Ipoh White Coffee Co.',
  'Melaka Nyonya Kitchen',
  'JB Sports Hub',
]
const offers = [
  '20% off total bill',
  '15% Off Total Bill',
  'Free kopi O with set',
  'RM10 off crafts',
  'Buy 1 get 1 gym day pass',
  '30% off spa treatment',
]
const statuses: Redemption['status'][] = ['successful', 'failed', 'cancelled', 'successful', 'successful']

function buildRedemptions(): Redemption[] {
  const list: Redemption[] = []
  for (let i = 0; i < 34; i++) {
    const status = statuses[i % statuses.length]
    const day = String((i % 27) + 1).padStart(2, '0')
    const hour = String(9 + (i % 10)).padStart(2, '0')
    const minute = String((i * 7) % 60).padStart(2, '0')
    const redeemedAt = `2026-08-${day}T${hour}:${minute}:00.000Z`
    const code = String(1284 + i).padStart(6, '0')

    list.push({
      id: `red-${String(i + 1).padStart(4, '0')}`,
      redemptionCode: `RED-${code}`,
      memberId: `mem-${String((i % 8) + 1).padStart(4, '0')}`,
      memberName: members[i % members.length],
      merchantId: `m-${String(100 + (i % 6)).padStart(4, '0')}`,
      merchantName: merchants[i % merchants.length],
      offerId: `ofr-${String(100 + (i % 6)).padStart(4, '0')}`,
      offerTitle: offers[i % offers.length],
      redeemedAt,
      status,
      method: i % 2 === 0 ? 'QR scan' : 'Merchant code',
      verificationStatus: status === 'successful' ? 'Verified' : status === 'failed' ? 'Rejected' : 'Voided',
      activity: [
        {
          id: `act-${i}-1`,
          dateLabel: `12 Aug 2026 · ${hour}:${minute}`,
          description: 'Redemption initiated by member',
        },
        {
          id: `act-${i}-2`,
          dateLabel: `12 Aug 2026 · ${hour}:${String(Number(minute) + 1).padStart(2, '0')}`,
          description:
            status === 'successful'
              ? 'Merchant verified redemption successfully'
              : status === 'failed'
                ? 'Verification failed — offer limit reached'
                : 'Redemption cancelled by member',
        },
      ],
    })
  }

  list[0] = {
    ...list[0],
    id: 'red-0001',
    redemptionCode: 'RED-001284',
    memberName: 'Nurul Aisyah',
    merchantName: 'Kedai Kopi Anika',
    offerTitle: '20% off total bill',
    redeemedAt: '2026-08-12T02:42:00.000Z',
    status: 'successful',
    method: 'QR scan',
    verificationStatus: 'Verified',
  }

  return list
}

export const initialRedemptions: Redemption[] = buildRedemptions()

export const REDEMPTION_SUMMARY = {
  total: 11905,
  today: 86,
  thisMonth: 2140,
  successful: 11240,
} as const
