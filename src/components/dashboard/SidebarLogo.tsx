import ilokalLogo from '../../assets/ilokal-logo.png'

export function SidebarLogo() {
  return (
    <div className="px-4 pt-4">
      <div className="flex h-10 w-full max-w-[200px] items-center justify-center rounded-lg bg-white px-2.5">
        <img
          src={ilokalLogo}
          alt="iLokal"
          className="h-8 w-auto max-w-full object-contain"
        />
      </div>
    </div>
  )
}
