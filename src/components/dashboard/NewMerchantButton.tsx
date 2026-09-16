import { useNavigate } from 'react-router-dom'

export function NewMerchantButton() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/merchants/create')}
      className="inline-flex h-10 min-h-[40px] shrink-0 items-center rounded-lg bg-action px-4 text-[13px] font-semibold text-white transition hover:bg-[#c82027] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/35 active:bg-[#b41c22]"
    >
      + New merchant
    </button>
  )
}
