import { initialReviews } from '../data/reviews'
import type { ReviewItem, ReviewStatus } from '../types/review'

type Listener = () => void

let reviews: ReviewItem[] = structuredClone(initialReviews)
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((l) => l())
}

export function subscribeReviews(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getReviews(): ReviewItem[] {
  return reviews
}

export function getReviewById(id: string): ReviewItem | undefined {
  return reviews.find((r) => r.id === id)
}

export function setReviewStatus(id: string, status: ReviewStatus): void {
  reviews = reviews.map((r) => (r.id === id ? { ...r, status } : r))
  notify()
}

export function bulkSetReviewStatus(ids: string[], status: ReviewStatus): void {
  const idSet = new Set(ids)
  reviews = reviews.map((r) => (idSet.has(r.id) ? { ...r, status } : r))
  notify()
}

export function deleteReview(id: string): void {
  reviews = reviews.filter((r) => r.id !== id)
  notify()
}

export function bulkDeleteReviews(ids: string[]): void {
  const idSet = new Set(ids)
  reviews = reviews.filter((r) => !idSet.has(r.id))
  notify()
}
