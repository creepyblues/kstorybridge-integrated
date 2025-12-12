import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';

interface PreviewLayout3Props {
  children: ReactNode;
}

export default function PreviewLayout3({ children }: PreviewLayout3Props) {
  const location = useLocation();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Chat', href: '/preview/design3', icon: 'solar:chat-round-dots-bold-duotone' },
    { name: 'Comps Navigator', href: '/preview/design3/comps', icon: 'solar:compass-bold-duotone' },
    { name: 'Mandate Matcher', href: '/buyers/mandates', icon: 'solar:stars-bold-duotone' },
    { name: 'Featured', href: '/buyers/featured', icon: 'solar:star-bold-duotone' },
    { name: 'Titles', href: '/buyers/titles', icon: 'solar:book-bold-duotone' },
    { name: 'Saved', href: '/buyers/saved', icon: 'solar:heart-bold-duotone' },
    { name: 'Plan', href: '/buyers/plan', icon: 'solar:card-bold-duotone' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-slate-200 shadow-lg"
      >
        {isMobileMenuOpen ? <Icon icon="solar:close-circle-bold-duotone" className="h-6 w-6" /> : <Icon icon="solar:hamburger-menu-bold-duotone" className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 shadow-sm
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-cyan-600 bg-clip-text text-transparent">
              KStoryBridge
            </h1>
            <p className="text-xs text-gray-500 mt-1">Design 3: Slate & Cyan</p>
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
                    flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                    ${active
                      ? 'bg-slate-100 text-slate-900 border-l-4 border-cyan-500'
                      : 'text-gray-600 hover:bg-slate-50 border-l-4 border-transparent'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon icon={item.icon} className={`h-4 w-4 ${active ? 'text-cyan-600' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 space-y-1">
            <Link
              to="/buyers/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 text-sm hover:bg-slate-50 transition-colors"
            >
              <Icon icon="solar:user-bold-duotone" className="h-4 w-4 text-gray-400" />
              <span className="font-medium">Profile</span>
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Icon icon="solar:logout-2-bold-duotone" className="h-4 w-4" />
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
