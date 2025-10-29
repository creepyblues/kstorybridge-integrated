import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import { CMSLayout } from "./layout/CMSLayout";
import SessionTracker from "./SessionTracker";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <SessionTracker />
      <CMSLayout>{children}</CMSLayout>
    </ProtectedRoute>
  );
}