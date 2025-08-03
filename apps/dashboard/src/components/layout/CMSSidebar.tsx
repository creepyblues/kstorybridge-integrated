
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  Heart,
  DollarSign,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const getDiscoverItems = (accountType: string) => {
  if (accountType === "ip_owner") {
    return [
      { title: "Content", href: "/content", icon: FileText },
    ];
  } else {
    return [
      { title: "Titles", href: "/titles", icon: FileText },
      { title: "Favorites", href: "/favorites", icon: Heart },
    ];
  }
};

const getSettingsItems = () => {
  return [
    { title: "Profile", href: "/profile", icon: User },
  ];
};

export function CMSSidebar() {
  const { user } = useAuth();
  const location = useLocation();

  // Get account type from user metadata, default to buyer
  const accountType = user?.user_metadata?.account_type || "buyer";
  const discoverItems = getDiscoverItems(accountType);
  const settingsItems = getSettingsItems();

  return (
    <div className="w-64 bg-white border-r border-porcelain-blue-200 h-[calc(100vh-73px)] flex flex-col">
      <nav className="p-4 flex-1">
        {/* DISCOVER Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-midnight-ink-400 uppercase tracking-wider mb-3 px-3">
            DISCOVER
          </h3>
          <div className="space-y-2">
            {discoverItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors",
                    isActive
                      ? "bg-hanok-teal text-white"
                      : "text-midnight-ink-600 hover:bg-porcelain-blue-100 hover:text-midnight-ink"
                  )}
                >
                  <Icon className="w-4 h-4" />
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
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-hanok-teal text-white"
                    : "text-midnight-ink-600 hover:bg-porcelain-blue-100 hover:text-midnight-ink"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
