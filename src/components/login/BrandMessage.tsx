export function BrandMessage() {
  return (
    <div className="max-w-[460px]">
      <div className="mb-5 h-[5px] w-[55px] rounded-full bg-gold" aria-hidden="true" />
      <h1 className="text-[32px] font-bold leading-[1.15] tracking-[-0.02em] text-white sm:text-[36px] lg:text-[44px]">
        The control room for{' '}
        <br className="hidden sm:block" />
        every merchant and member.
      </h1>
      <p className="mt-5 max-w-[400px] text-[15px] font-medium leading-[1.55] text-[#9EB0C7] sm:text-[16px]">
        Onboard merchants, publish offers, watch redemptions land in real time.
      </p>
    </div>
  )
}
