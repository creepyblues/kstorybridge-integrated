/**
 * Professional Dashboard Card Components
 * Modern, accessible cards for dashboard interfaces
 */
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Base card variants
const cardVariants = cva(
  [
    'rounded-xl border bg-white transition-all duration-200',
    'hover:shadow-lg focus-within:ring-2 focus-within:ring-primary-500/20',
  ],
  {
    variants: {
      variant: {
        default: 'border-gray-200 shadow-card',
        elevated: 'border-gray-200 shadow-lg',
        outlined: 'border-2 border-gray-300 shadow-none',
        ghost: 'border-transparent shadow-none bg-transparent',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6', 
        lg: 'p-8',
      },
      hover: {
        true: 'hover:shadow-xl hover:border-primary-300 cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: false,
    },
  }
);

interface DashboardCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  className,
  variant,
  padding,
  hover,
  children,
  ...props
}) => {
  return (
    <div 
      className={cn(cardVariants({ variant, padding, hover, className }))}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Header Component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  action,
  className,
  ...props
}) => {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)} {...props}>
      <div className="flex items-center space-x-3">
        {Icon && (
          <div className="p-2 bg-primary-50 rounded-lg">
            <Icon className="h-5 w-5 text-primary-600" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

// Stat Card Component
interface StatCardProps extends Omit<DashboardCardProps, 'children'> {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: LucideIcon;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  className,
  ...cardProps
}) => {
  return (
    <DashboardCard
      className={cn('relative overflow-hidden', className)}
      {...cardProps}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-primary-50 to-primary-100 rounded-full opacity-50" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {Icon && (
            <div className="p-2 bg-primary-100 rounded-lg">
              <Icon className="h-4 w-4 text-primary-600" />
            </div>
          )}
        </div>
        
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          
          {trend && (
            <div className={cn(
              'flex items-center px-2 py-1 rounded-full text-xs font-medium',
              trend.isPositive 
                ? 'bg-success-50 text-success-700'
                : 'bg-error-50 text-error-700'
            )}>
              <span className={cn(
                'mr-1',
                trend.isPositive ? 'text-success-600' : 'text-error-600'
              )}>
                {trend.isPositive ? '↗' : '↘'}
              </span>
              {trend.value}
            </div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
};

// Quick Action Card Component
interface QuickActionCardProps extends Omit<DashboardCardProps, 'children'> {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon: Icon,
  onClick,
  className,
  ...cardProps
}) => {
  return (
    <DashboardCard
      hover
      onClick={onClick}
      className={cn(
        'group transition-all duration-200 hover:border-primary-300',
        className
      )}
      {...cardProps}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-primary-50 rounded-xl group-hover:bg-primary-100 transition-colors">
          <Icon className="h-8 w-8 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </DashboardCard>
  );
};

// Table Card Component
interface TableCardProps extends Omit<DashboardCardProps, 'children'> {
  title: string;
  headers: string[];
  data: Array<Record<string, any>>;
  onRowClick?: (row: Record<string, any>) => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  title,
  headers,
  data,
  onRowClick,
  className,
  ...cardProps
}) => {
  return (
    <DashboardCard padding="none" className={className} {...cardProps}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th 
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr 
                key={index}
                className={cn(
                  'hover:bg-gray-50',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {Object.values(row).map((value, cellIndex) => (
                  <td 
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
};

// Empty State Card Component
interface EmptyStateCardProps extends Omit<DashboardCardProps, 'children'> {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title,
  description,
  icon: Icon,
  action,
  className,
  ...cardProps
}) => {
  return (
    <DashboardCard 
      className={cn('flex flex-col items-center justify-center py-12', className)}
      {...cardProps}
    >
      <div className="p-4 bg-gray-100 rounded-xl mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </DashboardCard>
  );
};