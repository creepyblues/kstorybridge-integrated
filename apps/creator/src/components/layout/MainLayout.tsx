import { CMSSidebar } from './CMSSidebar'
import Footer from '../Footer'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <CMSSidebar />
      <main className="flex-1 md:ml-64 flex flex-col">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-16 md:pt-4">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  )
}
