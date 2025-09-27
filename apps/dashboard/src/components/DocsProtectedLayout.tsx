import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import { DocsLayout } from "./layout/DocsLayout";
import SessionTracker from "./SessionTracker";

interface DocsProtectedLayoutProps {
  children: ReactNode;
}

export function DocsProtectedLayout({ children }: DocsProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <SessionTracker />
      <DocsLayout>{children}</DocsLayout>
    </ProtectedRoute>
  );
}