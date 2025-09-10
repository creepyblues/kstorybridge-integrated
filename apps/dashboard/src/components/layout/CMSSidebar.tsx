
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  title: string;
  href: string;
  badge?: string;
  icon?: string;
}

const getDiscoverItems = (accountType: string): MenuItem[] => {
  if (accountType === "creator") {
    return [
      { title: "Home", href: "/creators/home" },
      { title: "My Titles", href: "/creators/titles" },
      { title: "K-content News", href: "/creators/news" },
      // { title: "My Requests", href: "/creators/requests" },
    ];
  } else {
    return [
      { title: "Home", href: "/buyers/home" },
      { title: "Titles", href: "/buyers/titles" },
      { title: "Favorites", href: "/buyers/favorites" },
      { title: "K-content News", href: "/buyers/news" },
      // { title: "My Requests", href: "/buyers/requests" },
    ];
  }
};

const getSettingsItems = (accountType: string, userEmail?: string): MenuItem[] => {
  const isAdmin = userEmail === 'sungho@dadble.com' || userEmail === 'kevin@sandstoneartists.com';
  
  const baseItems = accountType === "creator" 
    ? [
        { title: "Profile", href: "/creators/profile" },
        // { title: "Send msg", href: "/creators/send-message" }, // Hidden for now - needs database setup
      ]
    : [
        // { title: "Send msg", href: "/buyers/send-message" }, // Hidden for now - needs database setup
        { title: "Profile", href: "/buyers/profile" },
      ];
  
  // Add Experiment page for admin users right after Profile
  if (isAdmin) {
    const profileIndex = baseItems.findIndex(item => item.title === 'Profile');
    baseItems.splice(profileIndex + 1, 0, {
      title: "Experiment",
      href: "/experiment",
      badge: "admin",
      icon: "⚡"
    });
  }
  
  return baseItems;
};

export function CMSSidebar() {
  const { user } = useAuth();
  const location = useLocation();

  // Get account type from user metadata, default to buyer
  const accountType = user?.user_metadata?.account_type || "buyer";
  const userEmail = user?.email;
  const discoverItems = getDiscoverItems(accountType);
  const settingsItems = getSettingsItems(accountType, userEmail);

  return (
    /* Desktop Sidebar - hidden on mobile */
    <div className="hidden lg:block fixed left-0 top-[73px] w-64 bg-white border-r border-porcelain-blue-200 h-[calc(100vh-73px)] flex flex-col z-30">
      <nav className="p-4 flex-1">
        {/* DISCOVER Section */}
        <div className="mb-6 mt-8">
          <h3 className="text-xs font-semibold text-midnight-ink-400 uppercase tracking-wider mb-3 px-3">
            DISCOVER
          </h3>
          <div className="space-y-2">
            {discoverItems.map((item) => {
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
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      
      {/* SETTINGS Section */}
      <div className="p-4 border-t border-porcelain-blue-200">
        <h3 className="text-xs font-semibold text-midnight-ink-400 uppercase tracking-wider mb-3 px-3">
          SETTINGS
        </h3>
        <div className="space-y-2">
          {settingsItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-hanok-teal text-white"
                    : "text-midnight-ink-600 hover:bg-porcelain-blue-100 hover:text-midnight-ink"
                )}
              >
                <div className="flex items-center gap-2">
                  {item.icon && <span className="text-base">{item.icon}</span>}
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    "px-1.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
                    item.badge === 'admin' 
                      ? "bg-purple-500 text-white"
                      : "bg-red-500 text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
