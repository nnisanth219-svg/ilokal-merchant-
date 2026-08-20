export type CategoryStatus = 'active' | 'inactive'

export interface CategoryItem {
  id: string
  name: string
  description: string
  merchantsCount: number
  offersCount: number
  status: CategoryStatus
  displayOrder: number
  updatedAt: string
}

export interface CategoryFormValues {
  name: string
  description: string
  status: CategoryStatus
  displayOrder: number
}

export const CATEGORY_STATUS_FILTERS: {
  value: CategoryStatus | 'all'
  label: string
}[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]
