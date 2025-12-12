import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { AdminManualModal } from '@/components/admin/AdminManualModal';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Admin layout with sidebar navigation
 *
 * Provides consistent layout and navigation for all admin pages.
 * Includes sidebar with links to 5 selected admin tools.
 * Responsive: hamburger menu on mobile, sidebar on desktop.
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: 'Trending',
      href: '/admin/trending',
      icon: 'solar:graph-up-bold-duotone',
      description: 'Manage featured titles'
    },
    {
      name: 'Titles',
      href: '/admin/titles',
      icon: 'solar:library-bold-duotone',
      description: 'Manage all titles'
    },
    {
      name: 'Drafts',
      href: '/admin/drafts',
      icon: 'solar:document-add-bold-duotone',
      description: 'Review creator drafts'
    },
    {
      name: 'Content',
      href: '/admin/content',
      icon: 'solar:book-bold-duotone',
      description: 'Learning & News CMS'
    },
    {
      name: 'Asset Generation',
      href: '/admin/asset-generation',
      icon: 'solar:stars-bold-duotone',
      description: 'AI-powered marketing assets'
    },
    {
      name: 'Pitch Extractor',
      href: '/admin/pitch-extractor',
      icon: 'solar:document-text-bold-duotone',
      description: 'Pitch deck analysis'
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header with Logo and Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <Icon icon="solar:widget-bold-duotone" className="w-6 h-6 text-gray-900" />
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          </div>

          {/* Help Button and Hamburger Menu */}
          <div className="flex items-center gap-1">
            <AdminManualModal />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5" /> : <Icon icon="solar:hamburger-menu-bold-duotone" className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed left-4 right-4 top-[60px] bg-white rounded-2xl shadow-xl border border-gray-300 z-50 overflow-hidden">
          <div className="py-2 max-h-[calc(100vh-80px)] overflow-y-auto">
            {/* Navigation Items */}
            {navigation.map((item) => {
              const isActive = location.pathname === item.href ||
                             location.pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-base font-normal transition-colors border-b border-gray-100 last:border-b-0",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon icon={item.icon} className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Separator */}
            <div className="border-t border-gray-300 my-1"></div>

            {/* Footer Actions */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/buyers/chat');
              }}
              className="flex items-center gap-3 px-4 py-3 text-base font-normal text-gray-900 hover:bg-gray-50 transition-colors w-full"
            >
              <Icon icon="solar:arrow-left-bold-duotone" className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleSignOut();
              }}
              className="flex items-center gap-3 px-4 py-3 text-base font-normal text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <Icon icon="solar:logout-2-bold-duotone" className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon icon="solar:widget-bold-duotone" className="w-6 h-6 text-gray-900" />
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <AdminManualModal />
          </div>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
                           location.pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon icon={item.icon} className="w-5 h-5" />
                <div className="flex-1">
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            );
          })}

          {/* Design Previews Section - Development Only */}
          {import.meta.env.DEV && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 px-3 py-2 mb-2">
                  <Icon icon="solar:pallete-2-bold-duotone" className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Design Previews
                  </span>
                </div>

                {/* Design 1 */}
                <div className="mb-3">
                  <div className="px-3 py-1 text-xs font-medium text-gray-700">
                    Design 1: Purple & Lavender
                  </div>
                  <Link
                    to="/preview/design1"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                  >
                    → Dashboard
                  </Link>
                  <Link
                    to="/preview/design1/comps"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                  >
                    → Comps Navigator
                  </Link>
                </div>

                {/* Design 2 */}
                <div className="mb-3">
                  <div className="px-3 py-1 text-xs font-medium text-gray-700">
                    Design 2: Hanok Teal & Sunrise Coral
                  </div>
                  <Link
                    to="/preview/design2"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-hanok-teal hover:bg-hanok-teal/5 rounded transition-colors"
                  >
                    → Dashboard
                  </Link>
                  <Link
                    to="/preview/design2/comps"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-hanok-teal hover:bg-hanok-teal/5 rounded transition-colors"
                  >
                    → Comps Navigator
                  </Link>
                </div>

                {/* Design 3 */}
                <div className="mb-3">
                  <div className="px-3 py-1 text-xs font-medium text-gray-700">
                    Design 3: Cool Slate & Cyan
                  </div>
                  <Link
                    to="/preview/design3"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 rounded transition-colors"
                  >
                    → Dashboard
                  </Link>
                  <Link
                    to="/preview/design3/comps"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 rounded transition-colors"
                  >
                    → Comps Navigator
                  </Link>
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-2">
          <Button
            onClick={() => navigate('/buyers/chat')}
            variant="outline"
            className="w-full justify-start"
            size="sm"
          >
            <Icon icon="solar:arrow-left-bold-duotone" className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            size="sm"
          >
            <Icon icon="solar:logout-2-bold-duotone" className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 pt-[60px] lg:pt-0 flex-1">
        <main className="min-h-screen w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
