
import { ReactNode } from "react";
import { CMSSidebar } from "./CMSSidebar";
import { CMSHeader } from "./CMSHeader";

interface CMSLayoutProps {
  children: ReactNode;
}

export function CMSLayout({ children }: CMSLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Fixed Header */}
      <CMSHeader />
      
      {/* Content area with sidebar - account for fixed header */}
      <div className="flex pt-[73px]">
        <CMSSidebar />
        <main className="flex-1 overflow-auto bg-gray-50 lg:ml-64 ml-0">
          <div className="max-w-none mx-auto py-8 px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
