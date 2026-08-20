import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createCategory,
  emptyCategoryForm,
  getCategoryById,
  updateCategory,
} from '../services/categoryStore'
import type { CategoryFormValues, CategoryStatus } from '../types/category'

export function CategoryFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const existing = id ? getCategoryById(id) : undefined

  const [values, setValues] = useState<CategoryFormValues>(() => {
    if (existing) {
      return {
        name: existing.name,
        description: existing.description,
        status: existing.status,
        displayOrder: existing.displayOrder,
      }
    }
    return emptyCategoryForm()
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setValues(emptyCategoryForm())
      return
    }
    const found = getCategoryById(id)
    if (found) {
      setValues({
        name: found.name,
        description: found.description,
        status: found.status,
        displayOrder: found.displayOrder,
      })
    }
  }, [id])

  if (isEdit && id && !getCategoryById(id)) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[20px] font-bold text-navy">Category not found</h1>
          <Link
            to="/categories"
            className="mt-3 inline-block text-[13px] font-semibold text-navy underline"
          >
            Back to categories
          </Link>
        </div>
      </div>
    )
  }

  function onSubmit(e: FormEvent): void {
    e.preventDefault()
    if (!values.name.trim()) {
      setError('Category name is required.')
      return
    }
    setError(null)
    if (isEdit && id) {
      updateCategory(id, values)
    } else {
      createCategory(values)
    }
    navigate('/categories')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6">
        <p className="text-[12px] text-muted">
          <Link to="/categories" className="font-medium text-navy hover:underline">
            Categories
          </Link>
          <span className="mx-1.5 text-muted/50">/</span>
          <span>{isEdit ? 'Edit category' : 'Add category'}</span>
        </p>
        <h1 className="mt-1 text-[18px] font-bold tracking-[-0.02em] text-navy">
          {isEdit ? 'Edit category' : 'Add category'}
        </h1>
        <p className="mt-0.5 text-[12px] text-muted">
          {isEdit
            ? 'Update category details used across merchants and offers.'
            : 'Create a new merchant category for the iLokal platform.'}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <form
          onSubmit={onSubmit}
          className="mx-auto max-w-2xl rounded-xl border border-border bg-white p-5 sm:p-6"
        >
          <div className="space-y-4">
            <label className="block">
              <span className="text-[12px] font-semibold text-navy">
                Category name <span className="text-action">*</span>
              </span>
              <input
                type="text"
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                placeholder="e.g. Food & Beverage"
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </label>

            <label className="block">
              <span className="text-[12px] font-semibold text-navy">Description</span>
              <textarea
                value={values.description}
                onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
                rows={4}
                placeholder="Short description of this category"
                className="mt-1.5 w-full resize-y rounded-lg border border-border bg-white px-3 py-2.5 text-[13px] text-navy outline-none placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[12px] font-semibold text-navy">Status</span>
                <select
                  value={values.status}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, status: e.target.value as CategoryStatus }))
                  }
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[12px] font-semibold text-navy">Display order</span>
                <input
                  type="number"
                  min={1}
                  value={values.displayOrder}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      displayOrder: Number(e.target.value) || 1,
                    }))
                  }
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
            </div>
          </div>

          {error ? <p className="mt-4 text-[13px] font-medium text-action">{error}</p> : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/categories')}
              className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg border border-border bg-white px-4 text-[13px] font-semibold text-navy hover:bg-page"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 min-h-[40px] items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-semibold text-white hover:bg-navy-secondary"
            >
              {isEdit ? 'Save changes' : 'Save category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
