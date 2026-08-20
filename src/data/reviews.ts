import type { ReviewItem } from '../types/review'

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
const texts = [
  'Great coffee and friendly service.',
  'Love the atmosphere — will come again.',
  'Discount applied smoothly at checkout.',
  'Staff were helpful but wait time was long.',
  'Excellent value for members.',
  'Average experience, expected more.',
  'Beautiful crafts and fair prices.',
  'Gym facilities are clean and well kept.',
]
const statuses: ReviewItem['status'][] = ['published', 'pending', 'flagged', 'hidden', 'published']

function buildReviews(): ReviewItem[] {
  const list: ReviewItem[] = []
  for (let i = 0; i < 30; i++) {
    const day = String((i % 27) + 1).padStart(2, '0')
    list.push({
      id: `rev-${String(i + 1).padStart(4, '0')}`,
      memberId: `mem-${String((i % 8) + 1).padStart(4, '0')}`,
      memberName: members[i % members.length],
      merchantId: `m-${String(100 + (i % 6)).padStart(4, '0')}`,
      merchantName: merchants[i % merchants.length],
      rating: (i % 5) + 1,
      text: texts[i % texts.length],
      submittedAt: `2026-08-${day}T10:00:00.000Z`,
      status: statuses[i % statuses.length],
    })
  }

  list[0] = {
    ...list[0],
    id: 'rev-0001',
    memberName: 'Nurul Aisyah',
    merchantName: 'Kedai Kopi Anika',
    rating: 5,
    text: 'Great coffee and friendly service.',
    submittedAt: '2026-08-12T10:00:00.000Z',
    status: 'published',
  }

  return list
}

export const initialReviews: ReviewItem[] = buildReviews()

export const REVIEW_SUMMARY = {
  total: 482,
  averageRating: '4.6',
  fiveStar: 268,
  needsAttention: 12,
} as const
