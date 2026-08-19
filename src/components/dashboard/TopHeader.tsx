import { DateFilter } from './DateFilter'
import { Greeting } from './Greeting'
import { NewMerchantButton } from './NewMerchantButton'
import { Search } from './Search'

export function TopHeader() {
  return (
    <header className="flex min-h-16 shrink-0 flex-col gap-3 border-b border-border bg-white px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0">
      <Greeting />
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <Search />
        <DateFilter />
        <NewMerchantButton />
      </div>
    </header>
  )
}
