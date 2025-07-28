
import { Bell, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

export function CMSHeader() {
  const { user, session, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="h-16 border-b border-porcelain-blue-200 bg-snow-white/80 backdrop-blur-sm flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
        <SidebarTrigger className="text-midnight-ink-600 hover:text-hanok-teal" />
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-midnight-ink-600 hover:text-hanok-teal hover:bg-porcelain-blue-100">
          <Bell className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-midnight-ink-600 hover:text-hanok-teal hover:bg-porcelain-blue-100">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-hanok-teal text-snow-white">
                  {(user?.user_metadata?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <div className="text-sm text-midnight-ink">
                  {user?.user_metadata?.full_name || user?.email || "User"}
                </div>
                <div className="text-xs text-midnight-ink-500">
                  {user ? "Authenticated" : "Guest"}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-snow-white border-porcelain-blue-200">
            <DropdownMenuLabel className="text-midnight-ink">Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-porcelain-blue-200" />
            <DropdownMenuItem className="text-midnight-ink-700 hover:text-hanok-teal hover:bg-porcelain-blue-50">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-midnight-ink-700 hover:text-hanok-teal hover:bg-porcelain-blue-50">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-porcelain-blue-200" />
            <DropdownMenuItem 
              className="text-midnight-ink-700 hover:text-sunrise-coral hover:bg-sunrise-coral-50"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
