export async function collectAllPages<T>(
  fetchPage: (
    page: number,
    pageSize: number,
  ) => Promise<{ items: T[]; totalPages: number }>,
  pageSize = 100,
): Promise<T[]> {
  const first = await fetchPage(1, pageSize)
  const items = [...first.items]
  const totalPages = Math.max(1, first.totalPages)
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchPage(page, pageSize)
    items.push(...next.items)
  }
  return items
}
