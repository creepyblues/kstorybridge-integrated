import { Link, useLocation } from 'react-router-dom';
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
    title: 'Scraper Test',
    href: '/scraper-test',
  },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-porcelain-blue-200 h-[calc(100vh-73px)]">
      <nav className="p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
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
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}