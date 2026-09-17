import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/merchants/ConfirmDialog'
import { ReviewStatusBadge } from '../components/reviews/ReviewStatusBadge'
import { formatDate } from '../components/cms/AdminListPrimitives'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import {
  getReviewApi,
  softDeleteReviewApi,
  updateReviewStatusApi,
} from '../services/reviewApi'
import { canDeleteInModule, canEditInModule } from '../types/auth'
import type { ReviewItem } from '../types/review'

function stars(rating: number): string {
  const safe = Math.max(0, Math.min(5, Math.round(rating)))
  return `${'★'.repeat(safe)}${'☆'.repeat(5 - safe)}`
}

export function ReviewDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = canEditInModule(user, 'Reviews')
  const canDelete = canDeleteInModule(user, 'Reviews')
  const [item, setItem] = useState<ReviewItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getReviewApi(id)
      .then((data) => {
        if (!cancelled) setItem(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setItem(null)
          setError(err instanceof Error ? err.message : 'Unable to load review')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function reload(): Promise<void> {
    const data = await getReviewApi(id)
    setItem(data)
  }

  async function handleMarkReviewed(): Promise<void> {
    if (!item) return
    try {
      setError(null)
      await updateReviewStatusApi(item.id, 'published')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update review')
    }
  }

  async function handleHide(): Promise<void> {
    if (!item) return
    try {
      setError(null)
      await updateReviewStatusApi(item.id, 'hidden')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update review')
    }
  }

  async function handleDelete(): Promise<void> {
    if (!item) return
    try {
      setError(null)
      await softDeleteReviewApi(item.id)
      setConfirmDelete(false)
      navigate('/reviews')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete review')
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[20px] font-bold text-navy">Review not found</h1>
          {error ? <p className="mt-2 text-[13px] text-action">{error}</p> : null}
          <Link
            to="/reviews"
            className="mt-3 inline-block text-[13px] font-semibold text-navy underline"
          >
            Back to reviews
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:h-full lg:overflow-hidden">
      <header className="shrink-0 bg-navy px-4 py-5 text-white sm:px-6 sm:py-6">
        <p className="text-[12px] text-white/65">
          <Link to="/reviews" className="hover:text-white">
            Reviews
          </Link>
          <span className="mx-1.5 text-white/40">/</span>
          <span className="text-gold">{item.memberName}</span>
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">
                {item.merchantName}
              </h1>
              <span className="inline-flex items-center rounded-full bg-white/10 px-1 py-0.5">
                <ReviewStatusBadge status={item.status} />
              </span>
            </div>
            <p className="mt-1 text-[15px] text-gold">{stars(item.rating)}</p>
            <p className="mt-1 text-[13px] text-white/70">
              by {item.memberName} · {formatDate(item.submittedAt)}
            </p>
            {error ? <p className="mt-2 text-[12px] text-action">{error}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/reviews')}
              className="inline-flex h-10 min-h-[40px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
            >
              Back
            </button>
            {canEdit ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleMarkReviewed()}
                  className="inline-flex h-10 min-h-[40px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
                >
                  Mark as reviewed
                </button>
                <button
                  type="button"
                  onClick={() => void handleHide()}
                  className="inline-flex h-10 min-h-[40px] flex-1 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-[13px] font-semibold text-white hover:bg-white/15 sm:flex-none"
                >
                  Hide
                </button>
              </>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex h-10 min-h-[40px] w-full items-center justify-center rounded-lg bg-action px-3.5 text-[13px] font-semibold text-white hover:bg-[#c82027] sm:w-auto"
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid gap-4 xl:grid-cols-3">
          <section className="rounded-xl border border-border bg-white p-5 xl:col-span-2">
            <h2 className="text-[15px] font-bold text-navy">Review</h2>
            <p className="mt-0.5 text-[12px] text-muted">Member feedback</p>
            <p className="mt-4 text-[15px] leading-relaxed text-navy">&ldquo;{item.text}&rdquo;</p>
            <p className="mt-4 text-[13px] text-gold">{stars(item.rating)}</p>
            <p className="mt-2 text-[12px] text-muted">Submitted {formatDate(item.submittedAt)}</p>
          </section>

          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-white p-5">
              <h2 className="text-[15px] font-bold text-navy">Member</h2>
              <p className="mt-3 text-[14px] font-semibold text-navy">{item.memberName}</p>
              <button
                type="button"
                onClick={() => navigate(`/members/${item.memberId}`)}
                className="mt-3 inline-flex h-9 items-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page"
              >
                View member
              </button>
            </section>
            <section className="rounded-xl border border-border bg-white p-5">
              <h2 className="text-[15px] font-bold text-navy">Merchant</h2>
              <p className="mt-3 text-[14px] font-semibold text-navy">{item.merchantName}</p>
              <button
                type="button"
                onClick={() => navigate(`/merchants/${item.merchantId}`)}
                className="mt-3 inline-flex h-9 items-center rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-navy hover:bg-page"
              >
                View merchant
              </button>
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete review?"
        message={`Permanently remove the review from ${item.memberName}? This cannot be undone.`}
        confirmLabel="Delete review"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
