import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react'
import { ReactNode } from 'react'

interface PricingCardProps {
  title: string
  price: string
  originalPrice?: string
  period?: string
  description?: string
  features: ReactNode[]
  buttonText: string
  onButtonClick: () => void
  popular?: boolean
  icon?: string
  className?: string
}

export function PricingCard({
  title,
  price,
  originalPrice,
  period,
  description,
  features,
  buttonText,
  onButtonClick,
  popular = false,
  icon,
  className = '',
}: PricingCardProps) {
  return (
    <Card
      className={`h-full relative overflow-hidden transition-all duration-300 ${
        popular
          ? 'border-2 border-sunrise-coral bg-gradient-to-b from-sunrise-coral/5 to-white shadow-lg shadow-sunrise-coral/10'
          : 'border-gray-200 hover:border-sunrise-coral/50 bg-white'
      } ${className}`}
    >
      {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-sunrise-coral to-orange-400" />
      )}

      <CardContent className="p-6 sm:p-8 flex flex-col h-full">
        {/* Popular Badge Area - Fixed height, always reserved */}
        <div className="h-[32px] flex items-center justify-center mb-2">
          {popular && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-sunrise-coral text-white">
              <Icon icon="solar:star-bold" className="h-3 w-3" />
              Most Popular
            </span>
          )}
        </div>

        {/* Icon Area - Fixed height */}
        <div className="h-[56px] flex items-center justify-center mb-4">
          {icon && (
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                popular
                  ? 'bg-gradient-to-br from-sunrise-coral to-orange-400'
                  : 'bg-gray-100'
              }`}
            >
              <Icon
                icon={icon}
                className={`h-7 w-7 ${popular ? 'text-white' : 'text-gray-600'}`}
              />
            </div>
          )}
        </div>

        {/* Title Section - Fixed height */}
        <div className="h-[36px] flex items-center justify-center">
          <h3 className="text-xl sm:text-2xl font-bold text-black text-center">
            {title}
          </h3>
        </div>

        {/* Description Section - Fixed min-height */}
        <div className="min-h-[48px] mb-6 flex items-start justify-center">
          {description && (
            <p className="text-gray-500 text-sm text-center">{description}</p>
          )}
        </div>

        {/* Price Section - Fixed height */}
        <div className="h-[80px] flex flex-col justify-end text-center mb-6">
          {/* Always reserve space for original price line */}
          <div className="h-[28px] flex items-center justify-center">
            {originalPrice && (
              <span className="text-lg text-gray-400 line-through">
                {originalPrice}
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span
              className={`text-4xl sm:text-5xl font-bold ${
                popular ? 'text-sunrise-coral' : 'text-black'
              }`}
            >
              {price}
            </span>
            {period && (
              <span className="text-gray-500 text-base ml-1">{period}</span>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={onButtonClick}
          className={`w-full h-12 text-base font-semibold mb-6 transition-all ${
            popular
              ? 'bg-sunrise-coral text-white hover:bg-sunrise-coral/90 shadow-lg shadow-sunrise-coral/25'
              : 'border-gray-300 hover:bg-gray-100 hover:border-gray-400'
          }`}
          variant={popular ? 'default' : 'outline'}
        >
          {buttonText}
        </Button>

        {/* Features Section - Grows to fill remaining space */}
        <div className="flex-grow border-t border-gray-200 pt-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
            What's included
          </p>

          {/* Features List */}
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    popular ? 'bg-sunrise-coral/10' : 'bg-gray-100'
                  }`}
                >
                  <Icon
                    icon="solar:check-circle-bold"
                    className={`h-4 w-4 ${
                      popular ? 'text-sunrise-coral' : 'text-gray-600'
                    }`}
                  />
                </div>
                <span className="text-gray-700 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
