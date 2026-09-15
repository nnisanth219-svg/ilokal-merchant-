export type CategoryStatus = 'active' | 'inactive' | 'deleted'

export interface CategoryItem {
  id: string
  name: string
  description: string
  merchantsCount: number
  offersCount: number
  status: CategoryStatus
  displayOrder: number
  updatedAt: string
  slug?: string
  createdAt?: string
  deletedAt?: string | null
}

export interface CategoryFormValues {
  name: string
  description: string
  status: Exclude<CategoryStatus, 'deleted'>
  displayOrder: number
}

export const CATEGORY_STATUS_FILTERS: {
  value: CategoryStatus | 'all'
  label: string
}[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'deleted', label: 'Deleted' },
]
