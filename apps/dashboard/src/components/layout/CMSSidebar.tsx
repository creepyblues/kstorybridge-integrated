
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const getDiscoverItems = (accountType: string) => {
  if (accountType === "ip_owner") {
    return [
      { title: "Titles", href: "/creators/titles" },
      { title: "K-content News", href: "/creators/news" },
      // { title: "My Requests", href: "/creators/requests" },
    ];
  } else {
    return [
      { title: "Titles", href: "/buyers/titles" },
      { title: "Favorites", href: "/buyers/favorites" },
      { title: "K-content News", href: "/buyers/news" },
      // { title: "My Requests", href: "/buyers/requests" },
    ];
  }
};

const getSettingsItems = (accountType: string, userEmail?: string) => {
  const isAuthorizedForChatbot = userEmail === 'sungho@dadble.com' || userEmail === 'kevin@sandstoneartists.com';
  
  const baseItems = accountType === "ip_owner" 
    ? [
        // { title: "Send msg", href: "/creators/send-message" }, // Hidden for now - needs database setup
        { title: "Profile", href: "/creators/profile" },
      ]
    : [
        // { title: "Send msg", href: "/buyers/send-message" }, // Hidden for now - needs database setup
        { title: "Profile", href: "/buyers/profile" },
      ];
  
  // Add chatbot items for authorized users right after Profile
  if (isAuthorizedForChatbot) {
    const profileIndex = baseItems.findIndex(item => item.title === 'Profile');
    const chatbotItems = accountType === "ip_owner" 
      ? [
          { title: "OpenAI Chatbot", href: "/creators/openai-chatbot", badge: "experiment" },
          { title: "AI Chatbot", href: "/creators/ai-chatbot", badge: "experiment" },
        ]
      : [
          { title: "OpenAI Chatbot", href: "/buyers/openai-chatbot", badge: "experiment" },
          { title: "AI Chatbot", href: "/buyers/ai-chatbot", badge: "experiment" },
        ];
    
    baseItems.splice(profileIndex + 1, 0, ...chatbotItems);
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
                <span>{item.title}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full uppercase tracking-wider">
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
