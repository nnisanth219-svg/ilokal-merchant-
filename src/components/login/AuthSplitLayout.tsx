import { Link } from 'react-router-dom'
import { BrandPanel } from './BrandPanel'
import { PortalLabel } from './PortalLabel'
import type { ReactNode } from 'react'

export function AuthSplitLayout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <main className="min-h-dvh w-full overflow-x-hidden bg-white md:h-dvh md:overflow-hidden">
      <div className="flex min-h-dvh w-full flex-col md:h-full md:min-h-0 md:flex-row">
        <BrandPanel />
        <section className="flex h-full w-full flex-col justify-center bg-white px-5 py-10 sm:px-12 sm:py-12 md:w-[42%] lg:w-[38%] lg:px-16 xl:px-20">
          <div className="mx-auto w-full max-w-[320px] md:mx-0">
            <PortalLabel />
            <h2 className="mt-3 text-[32px] font-bold leading-none tracking-[-0.02em] text-navy">
              {title}
            </h2>
            {children}
            <p className="mt-6 text-[13px] text-muted">
              <Link to="/login" className="font-semibold text-navy hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
