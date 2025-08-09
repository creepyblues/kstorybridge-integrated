/**
 * Professional Dashboard Layout Components
 * Modern layout system for dashboard interfaces
 */
import React from 'react';
import { cn } from '@/lib/utils';

// Main Dashboard Container
interface DashboardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div 
      className={cn('p-6 lg:p-8 space-y-8 max-w-7xl mx-auto', className)}
      {...props}
    >
      {children}
    </div>
  );
};

// Dashboard Page Header
interface DashboardPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const DashboardPageHeader: React.FC<DashboardPageHeaderProps> = ({
  title,
  subtitle,
  action,
  breadcrumbs,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
      <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex mb-2" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <span className="text-gray-400 mx-2">/</span>
                  )}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
        )}
      </div>
      
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

// Dashboard Grid System
interface DashboardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  cols = 3,
  gap = 'md',
  children,
  className,
  ...props
}) => {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-12',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div 
      className={cn(
        'grid',
        colsClasses[cols],
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Dashboard Section
interface DashboardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  description,
  action,
  children,
  className,
  ...props
}) => {
  return (
    <section className={cn('space-y-6', className)} {...props}>
      {(title || description || action) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
};

// Dashboard Tabs
interface DashboardTab {
  id: string;
  label: string;
  count?: number;
}

interface DashboardTabsProps {
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
              'transition-colors duration-200',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'ml-2 py-0.5 px-2 rounded-full text-xs',
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-100 text-gray-900'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

// Dashboard Search Bar
interface DashboardSearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

export const DashboardSearch: React.FC<DashboardSearchProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSubmit,
}) => {
  const [searchValue, setSearchValue] = React.useState(value || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onChange?.(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(searchValue);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative rounded-xl shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={handleChange}
          className={cn(
            'block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl',
            'placeholder-gray-400 text-gray-900 bg-white',
            'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'sm:text-sm transition-colors'
          )}
          placeholder={placeholder}
        />
      </div>
    </form>
  );
};

// Dashboard Filter Bar
interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface DashboardFilterBarProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filters,
  activeFilter,
  onFilterChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium',
            'transition-colors duration-200',
            activeFilter === filter.id
              ? 'bg-primary-100 text-primary-700 border border-primary-200'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          )}
        >
          {filter.label}
          {filter.count !== undefined && (
            <span className="ml-2 text-xs text-gray-500">
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};