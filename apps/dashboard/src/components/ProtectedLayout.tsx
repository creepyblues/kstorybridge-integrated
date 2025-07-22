import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import { CMSLayout } from "./layout/CMSLayout";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <CMSLayout>{children}</CMSLayout>
    </ProtectedRoute>
  );
}