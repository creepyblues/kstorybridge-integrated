import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import { AccountTypeProtectedRoute } from "./AccountTypeProtectedRoute";
import { CMSLayout } from "./layout/CMSLayout";
import SessionTracker from "./SessionTracker";

interface BuyerProtectedLayoutProps {
  children: ReactNode;
}

export function BuyerProtectedLayout({ children }: BuyerProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <AccountTypeProtectedRoute allowedAccountTypes={['buyer']}>
        <SessionTracker />
        <CMSLayout>{children}</CMSLayout>
      </AccountTypeProtectedRoute>
    </ProtectedRoute>
  );
}