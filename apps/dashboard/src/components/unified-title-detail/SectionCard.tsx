import { type ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

/** Consistent card wrapper for all title detail sections */
export function SectionCard({ title, subtitle, icon, children, className = '', noPadding }: SectionCardProps) {
  return (
    <div className={`bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden ${className}`}>
      {title && (
        <div className="border-l-4 border-[#4C9C9B] px-6 pt-5 pb-0">
          <div className="flex items-center gap-2.5">
            {icon && <span className="text-[#4C9C9B]">{icon}</span>}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1 ml-0">{subtitle}</p>
          )}
        </div>
      )}
      <div className={noPadding ? '' : 'px-6 py-5'}>
        {children}
      </div>
    </div>
  );
}
