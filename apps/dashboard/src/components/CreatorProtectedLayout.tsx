import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import { AccountTypeProtectedRoute } from "./AccountTypeProtectedRoute";
import { CMSLayout } from "./layout/CMSLayout";
import SessionTracker from "./SessionTracker";

interface CreatorProtectedLayoutProps {
  children: ReactNode;
}

export function CreatorProtectedLayout({ children }: CreatorProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <AccountTypeProtectedRoute allowedAccountTypes={['ip_owner']}>
        <SessionTracker />
        <CMSLayout>{children}</CMSLayout>
      </AccountTypeProtectedRoute>
    </ProtectedRoute>
  );
}