import { CMSSidebar } from './CMSSidebar'
import { useActivityBeacon } from '@/hooks/useActivityBeacon'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  useActivityBeacon()

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-rose-50/40 via-orange-50/20 to-amber-50/30">
      <CMSSidebar />
      <main className="flex-1 md:ml-64 flex flex-col">
        <div className="flex-1 px-12 sm:px-16 lg:px-24 pt-24 md:pt-12 pb-4 sm:pb-6 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  )
}
