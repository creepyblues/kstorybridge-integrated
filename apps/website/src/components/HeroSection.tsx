import React from 'react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  highlightText?: string;
  primaryCta?: {
    text: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  secondaryCta?: {
    text: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  children?: React.ReactNode;
  size?: 'default' | 'large';
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  highlightText,
  primaryCta,
  secondaryCta,
  children,
  size = 'default',
  className = ''
}) => {
  const sizeClasses = {
    default: 'py-20 lg:py-24',
    large: 'py-24 lg:py-32'
  };

  const titleSizeClasses = {
    default: 'text-4xl lg:text-6xl',
    large: 'text-5xl lg:text-7xl'
  };

  const renderTitle = () => {
    if (highlightText) {
      const parts = title.split(highlightText);
      return (
        <>
          {parts[0]}
          <span className="text-primary">{highlightText}</span>
          {parts[1]}
        </>
      );
    }
    return title;
  };

  return (
    <section className={`${sizeClasses[size]} px-4 lg:px-8 ${className}`}>
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={`${titleSizeClasses[size]} font-bold mb-6`}>
            {renderTitle()}
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-12">
            {subtitle}
          </p>
          
          {(primaryCta || secondaryCta || children) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {primaryCta && (
                <Button
                  size="lg"
                  className="px-8 py-4 text-lg rounded-full"
                  variant={primaryCta.variant || 'default'}
                  onClick={primaryCta.onClick}
                >
                  {primaryCta.text}
                </Button>
              )}
              {secondaryCta && (
                <Button
                  size="lg"
                  className="px-8 py-4 text-lg rounded-full"
                  variant={secondaryCta.variant || 'outline'}
                  onClick={secondaryCta.onClick}
                >
                  {secondaryCta.text}
                </Button>
              )}
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;