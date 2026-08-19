import { BrandFooter } from './BrandFooter'
import { BrandMessage } from './BrandMessage'
import { Logo } from './Logo'

export function BrandPanel() {
  return (
    <section className="relative flex min-h-[36vh] w-full flex-col bg-navy px-6 py-6 sm:min-h-[42vh] sm:px-12 sm:py-10 md:h-full md:min-h-0 md:w-[58%] lg:w-[62%] lg:px-[72px] lg:py-[64px]">
      <Logo />
      <div className="flex flex-1 flex-col justify-center pb-6 pt-12 sm:pb-8 sm:pt-[100px] lg:pt-[140px]">
        <BrandMessage />
      </div>
      <BrandFooter />
    </section>
  )
}
