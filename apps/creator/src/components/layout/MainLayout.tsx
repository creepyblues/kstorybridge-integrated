import { CMSSidebar } from './CMSSidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-rose-50/40 via-orange-50/20 to-amber-50/30">
      <CMSSidebar />
      <main className="flex-1 md:ml-64 flex flex-col">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 md:pt-4">
          {children}
        </div>
      </main>
    </div>
  )
}
