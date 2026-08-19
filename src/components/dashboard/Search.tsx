export function Search() {
  return (
    <label className="relative block min-w-0 flex-1 sm:flex-none">
      <span className="sr-only">Search merchants, members, orders</span>
      <input
        type="search"
        placeholder="Search merchants, members, orders..."
        className="h-[38px] w-full min-w-0 rounded-lg border border-border bg-white px-3 text-[13px] text-navy outline-none transition placeholder:text-muted focus:border-navy focus:ring-2 focus:ring-navy/10 sm:w-[220px] lg:w-[250px]"
      />
    </label>
  )
}
