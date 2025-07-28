
import { NavLink, useLocation } from "react-router-dom";
import {
  FileText,
  Heart,
  DollarSign
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const getNavigationItems = (accountType: string) => {
  if (accountType === "ip_owner") {
    return [
      { title: "Content", url: "/content", icon: FileText },
      { title: "Deals", url: "/deals", icon: DollarSign },
    ];
  } else {
    return [
      { title: "Titles", url: "/titles", icon: FileText },
      { title: "Favorites", url: "/favorites", icon: Heart },
      { title: "Deals", url: "/deals", icon: DollarSign },
    ];
  }
};

export function CMSSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  // Get account type from user metadata, default to buyer
  const accountType = user?.user_metadata?.account_type || "buyer";
  const navigationItems = getNavigationItems(accountType);

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    `sidebar-nav-link flex items-center gap-3 rounded-lg px-4 py-3 mb-2 transition-all duration-200 ${
      isActive
        ? "bg-white bg-opacity-20 text-white"
        : "text-white hover:bg-white hover:bg-opacity-10"
    }`;

  return (
    <Sidebar className={`${isCollapsed ? "w-16" : "w-80"} bg-hanok-teal shadow-lg`}>
      <SidebarContent className="p-6 bg-hanok-teal">
        <div className="mb-8 pt-6">
          <div className="flex justify-center items-center mb-6 px-4">
            {!isCollapsed ? (
              <div className="w-full h-16 flex items-center justify-center">
                <img 
                  src="/kstorybridge-logo.png" 
                  alt="KStoryBridge" 
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src="/kstorybridge-logo.png" 
                  alt="K" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClassName}
                      data-active={location.pathname === item.url}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium text-base">
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
