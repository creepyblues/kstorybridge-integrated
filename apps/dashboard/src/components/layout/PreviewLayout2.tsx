import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Compass,
  Sparkles,
  Star,
  BookOpen,
  Heart,
  CreditCard,
  Menu,
  X,
  User
} from 'lucide-react';

interface PreviewLayout2Props {
  children: ReactNode;
}

export default function PreviewLayout2({ children }: PreviewLayout2Props) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Chat', href: '/preview/design2', icon: MessageSquare },
    { name: 'Comps Navigator', href: '/preview/design2/comps', icon: Compass },
    { name: 'Mandate Matcher', href: '/buyers/mandates', icon: Sparkles },
    { name: 'Featured', href: '/buyers/featured', icon: Star },
    { name: 'Titles', href: '/buyers/titles', icon: BookOpen },
    { name: 'Saved', href: '/buyers/saved', icon: Heart },
    { name: 'Plan', href: '/buyers/plan', icon: CreditCard },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/40 via-teal-50/20 to-cyan-50/30">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 rounded-lg bg-white border border-red-200 shadow-lg"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 shadow-xl
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-hanok-teal">
              KStoryBridge
            </h1>
            <p className="text-xs text-gray-500 mt-1">Design 2: Hanok Teal & Sunrise Coral</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                    ${active
                      ? 'bg-hanok-teal/10 text-hanok-teal shadow-sm border border-hanok-teal/20'
                      : 'text-gray-700 hover:bg-hanok-teal/5'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-hanok-teal' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Link
              to="/buyers/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-hanok-teal/5 transition-colors"
            >
              <User className="h-5 w-5 text-gray-400" />
              <span className="font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 pt-16">
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
