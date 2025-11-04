import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard page container with centralized padding.
 *
 * ALL dashboard pages MUST use this component for consistent layout.
 *
 * Padding is controlled by CSS variables in /src/styles/layout-variables.css
 * To change padding globally (e.g., "2x the padding"), modify ONLY that file.
 *
 * Usage:
 * ```tsx
 * import { PageContainer } from '@/components/layout/PageContainer';
 *
 * export default function MyPage() {
 *   return (
 *     <PageContainer>
 *       <h1>Page Content</h1>
 *     </PageContainer>
 *   );
 * }
 * ```
 */
export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`page-container ${className}`}>
        {children}
      </div>
    </div>
  );
}

export default PageContainer;
