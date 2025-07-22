
import { ReactNode } from "react";
import { CMSSidebar } from "./CMSSidebar";
import { CMSHeader } from "./CMSHeader";

interface CMSLayoutProps {
  children: ReactNode;
}

export function CMSLayout({ children }: CMSLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-slate-950">
      <CMSSidebar />
      <div className="flex-1 flex flex-col">
        <CMSHeader />
        <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
