
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const getDiscoverItems = (accountType: string) => {
  if (accountType === "ip_owner") {
    return [
      { title: "Titles", href: "/creators/titles" },
      // { title: "My Requests", href: "/creators/requests" },
    ];
  } else {
    return [
      { title: "Titles", href: "/buyers/titles" },
      { title: "Favorites", href: "/buyers/favorites" },
      // { title: "My Requests", href: "/buyers/requests" },
    ];
  }
};

const getSettingsItems = (accountType: string) => {
  if (accountType === "ip_owner") {
    return [
      { title: "Profile", href: "/creators/profile" },
    ];
  } else {
    return [
      { title: "Profile", href: "/buyers/profile" },
    ];
  }
};

export function CMSSidebar() {
  const { user } = useAuth();
  const location = useLocation();

  // Get account type from user metadata, default to buyer
  const accountType = user?.user_metadata?.account_type || "buyer";
  const discoverItems = getDiscoverItems(accountType);
  const settingsItems = getSettingsItems(accountType);

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
      </div>
    </div>
  );
}
