import { CMSSidebar } from './CMSSidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <CMSSidebar />
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pt-16 md:pt-4">
        {children}
      </main>
    </div>
  )
}
