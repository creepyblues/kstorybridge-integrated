
import { ReactNode } from "react";
import { CMSSidebar } from "./CMSSidebar";
import { CMSHeader } from "./CMSHeader";

interface CMSLayoutProps {
  children: ReactNode;
}

export function CMSLayout({ children }: CMSLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      <CMSSidebar />
      <div className="flex-1 flex flex-col">
        <CMSHeader />
        <main className="flex-1 overflow-auto bg-white">
          <div className="max-w-none mx-auto py-12 pr-12 pl-24">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
