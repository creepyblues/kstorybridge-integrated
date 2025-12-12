import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';

interface PreviewLayout1Props {
  children: ReactNode;
}

export default function PreviewLayout1({ children }: PreviewLayout1Props) {
  const location = useLocation();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Chat', href: '/preview/design1', icon: 'solar:chat-round-dots-bold-duotone' },
    { name: 'Comps Navigator', href: '/preview/design1/comps', icon: 'solar:compass-bold-duotone' },
    { name: 'Mandate Matcher', href: '/buyers/mandates', icon: 'solar:stars-bold-duotone' },
    { name: 'Featured', href: '/buyers/featured', icon: 'solar:star-bold-duotone' },
    { name: 'Titles', href: '/buyers/titles', icon: 'solar:book-bold-duotone' },
    { name: 'Saved', href: '/buyers/saved', icon: 'solar:heart-bold-duotone' },
    { name: 'Plan', href: '/buyers/plan', icon: 'solar:card-bold-duotone' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-lavender-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-purple-200 shadow-lg"
      >
        {isMobileMenuOpen ? <Icon icon="solar:close-circle-bold-duotone" className="h-6 w-6" /> : <Icon icon="solar:hamburger-menu-bold-duotone" className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-purple-100 shadow-xl
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-purple-100">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              KStoryBridge
            </h1>
            <p className="text-xs text-gray-500 mt-1">Design 1: Purple & Lavender</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                    ${active
                      ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 shadow-sm'
                      : 'text-gray-700 hover:bg-purple-50'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon icon={item.icon} className={`h-5 w-5 ${active ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-purple-100 space-y-2">
            <Link
              to="/buyers/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-purple-50 transition-colors"
            >
              <Icon icon="solar:user-bold-duotone" className="h-5 w-5 text-gray-400" />
              <span className="font-medium">Profile</span>
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Icon icon="solar:logout-2-bold-duotone" className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        <main className="p-6 sm:p-8 lg:p-10">
          {children}
        </main>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
