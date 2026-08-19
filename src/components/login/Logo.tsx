import ilokalLogo from '../../assets/ilokal-logo.png'

export function Logo() {
  return (
    <div className="absolute left-8 top-8 flex h-[70px] w-[78px] items-center justify-center rounded-[12px] bg-white p-1.5 sm:left-12 sm:top-10 lg:left-[72px] lg:top-[64px]">
      <img
        src={ilokalLogo}
        alt="iLokal"
        className="h-full w-full object-contain"
      />
    </div>
  )
}
