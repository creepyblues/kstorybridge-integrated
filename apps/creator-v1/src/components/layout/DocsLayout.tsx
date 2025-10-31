import { ReactNode } from "react";

interface DocsLayoutProps {
  children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-none mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}