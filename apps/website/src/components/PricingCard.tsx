import React from 'react';
import { Card, CardContent, Button } from "@kstorybridge/ui";

import { Check } from 'lucide-react';

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  buttonText: string;
  onButtonClick: () => void;
  popular?: boolean;
  className?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  period,
  description,
  features,
  buttonText,
  onButtonClick,
  popular = false,
  className = ''
}) => {
  return (
    <Card className={`relative ${popular ? 'border-primary border-2' : ''} ${className}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold">
            Most Popular
          </span>
        </div>
      )}
      
      <CardContent className="p-8 lg:p-10 text-center">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        
        {description && (
          <p className="text-gray-600 mb-6">{description}</p>
        )}
        
        <div className="mb-8">
          <span className="text-5xl font-bold text-primary">{price}</span>
          {period && <span className="text-gray-600 text-lg ml-2">{period}</span>}
        </div>
        
        <ul className="space-y-4 mb-8 text-left">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          onClick={onButtonClick}
          className="w-full h-12 text-base font-semibold"
          variant={popular ? 'default' : 'outline'}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingCard;