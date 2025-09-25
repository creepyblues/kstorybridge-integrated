import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { cn } from '@/lib/utils';

interface StandardCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

export const StandardCard: React.FC<StandardCardProps> = ({
  title,
  children,
  className,
  contentClassName,
  headerClassName,
}) => {
  const baseCardClasses = "bg-transparent border-gray-200 shadow-none rounded-2xl";

  return (
    <Card className={cn(baseCardClasses, className)}>
      {title && (
        <CardHeader className={headerClassName}>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn("p-4 sm:p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
};

export default StandardCard;