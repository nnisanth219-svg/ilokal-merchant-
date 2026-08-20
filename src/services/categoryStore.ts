import { initialCategories } from '../data/categories'
import type { CategoryFormValues, CategoryItem } from '../types/category'

type Listener = () => void

let categories: CategoryItem[] = structuredClone(initialCategories)
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((l) => l())
}

export function subscribeCategories(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getCategories(): CategoryItem[] {
  return categories
}

export function getCategoryById(id: string): CategoryItem | undefined {
  return categories.find((c) => c.id === id)
}

export function emptyCategoryForm(): CategoryFormValues {
  return {
    name: '',
    description: '',
    status: 'active',
    displayOrder: categories.length + 1,
  }
}

export function createCategory(values: CategoryFormValues): CategoryItem {
  const created: CategoryItem = {
    id: `cat-${Date.now()}`,
    name: values.name.trim(),
    description: values.description.trim(),
    merchantsCount: 0,
    offersCount: 0,
    status: values.status,
    displayOrder: values.displayOrder,
    updatedAt: new Date().toISOString(),
  }
  categories = [created, ...categories]
  notify()
  return created
}

export function updateCategory(id: string, values: CategoryFormValues): CategoryItem | undefined {
  let updated: CategoryItem | undefined
  categories = categories.map((c) => {
    if (c.id !== id) return c
    updated = {
      ...c,
      name: values.name.trim(),
      description: values.description.trim(),
      status: values.status,
      displayOrder: values.displayOrder,
      updatedAt: new Date().toISOString(),
    }
    return updated
  })
  notify()
  return updated
}

export function setCategoryStatus(id: string, status: CategoryItem['status']): void {
  categories = categories.map((c) =>
    c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c,
  )
  notify()
}

export function bulkSetCategoryStatus(ids: string[], status: CategoryItem['status']): void {
  const idSet = new Set(ids)
  const now = new Date().toISOString()
  categories = categories.map((c) =>
    idSet.has(c.id) ? { ...c, status, updatedAt: now } : c,
  )
  notify()
}

export function deleteCategory(id: string): void {
  categories = categories.filter((c) => c.id !== id)
  notify()
}

export function bulkDeleteCategories(ids: string[]): void {
  const idSet = new Set(ids)
  categories = categories.filter((c) => !idSet.has(c.id))
  notify()
}
