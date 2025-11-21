
import { ReactNode } from "react";
import { CMSSidebar } from "./CMSSidebar";
import { CMSHeader } from "./CMSHeader";

interface CMSLayoutProps {
  children: ReactNode;
}

export function CMSLayout({ children }: CMSLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      {/* Content area with sidebar - no header */}
      <div className="flex flex-1">
        <CMSSidebar />
        <main className="flex-1 overflow-auto bg-gray-50 lg:ml-72 ml-0 lg:pt-0 pt-14">
          {/* Mobile-optimized padding: narrower on mobile, same on desktop */}
          <div className="max-w-none mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
