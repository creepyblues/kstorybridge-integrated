import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'default' | 'hover-primary' | 'rounded';
  iconSize?: 'default' | 'large';
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  variant = 'default',
  iconSize = 'default',
  className = ''
}) => {
  const getCardClasses = () => {
    const baseClasses = 'transition-shadow duration-300';
    
    switch (variant) {
      case 'hover-primary':
        return `${baseClasses} border-0 shadow-lg hover:shadow-xl rounded-2xl`;
      case 'rounded':
        return `${baseClasses} rounded-2xl`;
      default:
        return `${baseClasses} hover:shadow-lg`;
    }
  };

  const getIconClasses = () => {
    const baseClasses = 'text-primary';
    return iconSize === 'large' ? `${baseClasses} w-8 h-8` : `${baseClasses} w-6 h-6`;
  };

  const getIconContainerClasses = () => {
    if (variant === 'hover-primary') {
      return iconSize === 'large' 
        ? 'w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'
        : 'w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3';
    }
    return 'mb-4';
  };

  return (
    <Card className={`${getCardClasses()} ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className={getIconContainerClasses()}>
          <Icon className={getIconClasses()} />
        </div>
        <CardTitle className={variant === 'hover-primary' ? 'text-2xl font-bold' : 'text-xl font-bold'}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className={`text-gray-600 leading-relaxed ${
          variant === 'hover-primary' ? 'text-lg' : 'text-base'
        }`}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;