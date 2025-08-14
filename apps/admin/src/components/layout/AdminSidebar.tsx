import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'Titles',
    href: '/titles',
  },
  {
    title: 'User Approval',
    href: '/user-approval',
  },
  {
    title: 'Featured Titles',
    href: '/featured-titles',
  },
];

const toolsItems = [
  {
    title: 'Scraper Test',
    href: '/scraper-test',
  },
];

export default function AdminSidebar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-[85px] left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-porcelain-blue-200"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-[73px] w-64 bg-white border-r border-porcelain-blue-200 h-[calc(100vh-73px)] flex flex-col z-30 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <nav className="p-4 flex-1">
          {/* MANAGE Section */}
          <div className="mb-6 mt-8">
            <h3 className="text-xs font-semibold text-midnight-ink-400 uppercase tracking-wider mb-3 px-3">
              MANAGE
            </h3>
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-colors",
                      isActive
                        ? "bg-hanok-teal text-white"
                        : "text-midnight-ink-600 hover:bg-porcelain-blue-100 hover:text-midnight-ink"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* TOOLS Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-midnight-ink-400 uppercase tracking-wider mb-3 px-3">
              TOOLS
            </h3>
            <div className="space-y-2">
              {toolsItems.map((item) => {
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-hanok-teal text-white"
                        : "text-midnight-ink-600 hover:bg-porcelain-blue-100 hover:text-midnight-ink"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}