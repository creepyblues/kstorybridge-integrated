
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  Heart,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const getNavigationItems = (accountType: string) => {
  if (accountType === "ip_owner") {
    return [
      { title: "Content", href: "/content", icon: FileText },
      { title: "Deals", href: "/deals", icon: DollarSign },
    ];
  } else {
    return [
      { title: "Titles", href: "/titles", icon: FileText },
      { title: "Favorites", href: "/favorites", icon: Heart },
      { title: "Deals", href: "/deals", icon: DollarSign },
    ];
  }
};

export function CMSSidebar() {
  const { user } = useAuth();
  const location = useLocation();

  // Get account type from user metadata, default to buyer
  const accountType = user?.user_metadata?.account_type || "buyer";
  const navigationItems = getNavigationItems(accountType);

  return (
    <div className="w-64 bg-white border-r border-porcelain-blue-200 min-h-screen">
      <nav className="p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
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
      </nav>
    </div>
  );
}
