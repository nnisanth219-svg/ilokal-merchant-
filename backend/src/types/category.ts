export type CategoryStatusValue = 'active' | 'inactive' | 'deleted'

export interface CategoryDto {
  id: string
  name: string
  slug: string
  description: string
  merchantsCount: number
  offersCount: number
  status: CategoryStatusValue
  displayOrder: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CategoryListQuery {
  page: number
  pageSize: number
  search?: string
  status?: CategoryStatusValue | 'all'
  includeDeleted: boolean
  sortBy?: 'displayOrder' | 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface CategoryListResult {
  categories: CategoryDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    active: number
    withMerchants: number
    empty: number
  }
}

export interface CategoryWriteInput {
  name?: string
  description?: string
  status?: Exclude<CategoryStatusValue, 'deleted'>
  displayOrder?: number
}
