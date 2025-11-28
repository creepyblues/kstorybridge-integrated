import React from 'react';
import { Button } from '@kstorybridge/ui';
import { cn } from '@/lib/utils';

interface StandardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'pro';
  size?: 'sm' | 'default' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const StandardButton: React.FC<StandardButtonProps> = ({
  variant = 'outline',
  size = 'default',
  children,
  className,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'pro':
        return "bg-pro-purple hover:bg-pro-purple-600 text-white border-pro-purple";
      case 'outline':
      case 'default':
      default:
        return "border-gray-300 hover:bg-gray-100";
    }
  };

  const baseClasses = "transition-colors font-medium";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <Button
      variant={variant === 'pro' ? 'default' : variant}
      className={cn(
        baseClasses,
        getVariantClasses(),
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

export default StandardButton;