import ilokalLogo from '../../assets/ilokal-logo.png'

export function Logo() {
  return (
    <div className="absolute left-6 top-6 flex h-[56px] w-[64px] items-center justify-center rounded-[12px] bg-white p-1.5 sm:left-12 sm:top-10 sm:h-[70px] sm:w-[78px] lg:left-[72px] lg:top-[64px]">
      <img
        src={ilokalLogo}
        alt="iLokal"
        className="h-full w-full object-contain"
      />
    </div>
  )
}
