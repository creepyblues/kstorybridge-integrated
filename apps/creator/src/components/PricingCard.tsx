import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
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
  className = ''
}: PricingCardProps) {
  return (
    <Card
      className={`relative ${popular ? 'border-sunrise-coral-500 border-2' : 'border-gray-300'} ${className}`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-sunrise-coral-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
            Most Popular
          </span>
        </div>
      )}

      <CardContent className="p-6 sm:p-8 lg:p-10 text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-black mb-4">{title}</h3>

        {description && (
          <p className="text-gray-600 mb-6 text-sm sm:text-base">{description}</p>
        )}

        <div className="mb-6 min-h-[120px] flex flex-col justify-end">
          {originalPrice && (
            <div className="mb-2">
              <span className="text-xl sm:text-2xl font-bold text-gray-400 line-through">
                {originalPrice}
              </span>
              {period && <span className="text-gray-400 text-sm sm:text-base ml-1">{period}</span>}
            </div>
          )}
          <div>
            <span className="text-4xl sm:text-5xl font-bold text-black">{price}</span>
            {period && <span className="text-gray-600 text-base sm:text-lg ml-2">{period}</span>}
          </div>
        </div>

        <Button
          onClick={onButtonClick}
          className={`w-full h-12 text-base font-semibold mb-8 ${
            popular
              ? 'bg-sunrise-coral-500 text-white hover:bg-sunrise-coral-600'
              : 'border-gray-300 hover:bg-gray-100'
          }`}
          variant={popular ? 'default' : 'outline'}
        >
          {buttonText}
        </Button>

        <ul className="space-y-3 sm:space-y-4 text-left">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-sunrise-coral-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
