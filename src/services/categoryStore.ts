import type { CategoryFormValues } from '../types/category'

/**
 * Legacy in-memory store — Categories UI now uses categoryApi / PostgreSQL.
 * Kept only so older imports do not break; do not wire pages to this.
 */

export function emptyCategoryForm(): CategoryFormValues {
  return {
    name: '',
    description: '',
    status: 'active',
    displayOrder: 1,
  }
}
