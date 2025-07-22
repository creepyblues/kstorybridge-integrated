import React from 'react';

interface ProcessStepProps {
  step: string | number;
  title: string;
  description: string;
  variant?: 'default' | 'large' | 'minimal';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

const ProcessStep: React.FC<ProcessStepProps> = ({
  step,
  title,
  description,
  variant = 'default',
  color = 'primary',
  className = ''
}) => {
  const getStepContainerClasses = () => {
    const colorClasses = {
      primary: 'bg-primary text-white',
      secondary: 'bg-secondary text-white',
      accent: 'bg-accent text-white'
    };

    const sizeClasses = {
      default: 'w-16 h-16 text-xl',
      large: 'w-20 h-20 text-2xl',
      minimal: 'w-12 h-12 text-lg'
    };

    return `${colorClasses[color]} ${sizeClasses[variant]} rounded-full flex items-center justify-center font-bold mb-4`;
  };

  const getTitleClasses = () => {
    const sizeClasses = {
      default: 'text-xl',
      large: 'text-2xl',
      minimal: 'text-lg'
    };
    
    return `${sizeClasses[variant]} font-bold mb-3`;
  };

  const getDescriptionClasses = () => {
    return variant === 'large' ? 'text-gray-600 text-lg' : 'text-gray-600';
  };

  return (
    <div className={`text-center ${className}`}>
      <div className={getStepContainerClasses()}>
        {step}
      </div>
      <h3 className={getTitleClasses()}>
        {title}
      </h3>
      <p className={getDescriptionClasses()}>
        {description}
      </p>
    </div>
  );
};

export default ProcessStep;