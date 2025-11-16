import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import {
  LayoutDashboard,
  List,
  Star,
  Users,
  TestTube,
  FileText,
  ArrowLeft,
  LogOut,
  Zap,
  MessageSquare,
  FileEdit,
  Sparkles,
  BookOpen,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Admin layout with sidebar navigation
 *
 * Provides consistent layout and navigation for all admin pages.
 * Includes sidebar with links to all admin tools.
 * Responsive: hamburger menu on mobile, sidebar on desktop.
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: 'Featured',
      href: '/admin/featured',
      icon: Star,
      description: 'Manage featured titles'
    },
    {
      name: 'Titles',
      href: '/admin/titles',
      icon: List,
      description: 'View and edit titles'
    },
    {
      name: 'Drafts',
      href: '/admin/drafts',
      icon: FileEdit,
      description: 'Review creator drafts'
    },
    {
      name: 'Content',
      href: '/admin/content',
      icon: BookOpen,
      description: 'Learning & News CMS'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      description: 'User approval',
      disabled: true
    },
    {
      name: 'Scraper',
      href: '/admin/scraper',
      icon: TestTube,
      description: 'Scraper testing'
    },
    {
      name: 'Pitch Extraction',
      href: '/admin/pitch-extraction-test',
      icon: FileText,
      description: 'Pitch deck analysis'
    },
    {
      name: 'Asset Generation',
      href: '/admin/asset-generation',
      icon: Sparkles,
      description: 'AI-powered marketing assets'
    },
    {
      name: 'Chat Test',
      href: '/admin/chat-test',
      icon: MessageSquare,
      description: 'Chat testing'
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header with Logo and Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-gray-900" />
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
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
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.disabled ? '#' : item.href}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                    } else {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-base font-normal transition-colors border-b border-gray-100 last:border-b-0",
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : isActive
                        ? "bg-hanok-teal text-white"
                        : "text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-5 h-5" />
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
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleSignOut();
              }}
              className="flex items-center gap-3 px-4 py-3 text-base font-normal text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard className="w-6 h-6 text-gray-900" />
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
                           location.pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.disabled ? '#' : item.href}
                onClick={(e) => item.disabled && e.preventDefault()}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${item.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <div className="flex-1">
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-2">
          <Button
            onClick={() => navigate('/buyers/chat')}
            variant="outline"
            className="w-full justify-start"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 pt-[60px] lg:pt-0">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
