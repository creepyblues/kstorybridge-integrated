import React from 'react';

interface PremiumColumnProps {
  children: React.ReactNode;
  className?: string;
}

const PremiumColumn: React.FC<PremiumColumnProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="filter blur-sm select-none">
        {children}
      </div>
      
      {/* Subtle overlay to indicate restricted content */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm pointer-events-none"></div>
    </div>
  );
};

export default PremiumColumn;