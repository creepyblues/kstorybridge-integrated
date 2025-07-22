
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
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
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Content", url: "/content", icon: FileText },
      { title: "Deals", url: "/deals", icon: DollarSign },
    ];
  } else {
    return [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
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
    `flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
    }`;

  return (
    <Sidebar className={`${isCollapsed ? "w-16" : "w-64"} bg-slate-950 backdrop-blur-sm border-r border-slate-800`}>
      <SidebarContent className="p-4 bg-slate-950">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="h-12 w-auto flex items-center justify-center overflow-hidden">
              <img 
                src="/lovable-uploads/c6a6073a-6ad3-42a1-be8c-9b7f3f2cb7f4.png" 
                alt="Logo" 
                className="h-full w-auto object-contain max-w-full"
                onError={(e) => {
                  console.log('Logo failed to load:', e);
                }}
                onLoad={() => {
                  console.log('Logo loaded successfully');
                }}
              />
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 uppercase text-xs font-semibold mb-4">
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={getNavClassName}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
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
