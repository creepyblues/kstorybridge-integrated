/**
 * MandateExamples Component
 *
 * Displays curated mandate examples in the "Need help" modal.
 * Shows detailed examples with explanations to help users understand
 * how to write effective mandate descriptions.
 *
 * IMPORTANT: Uses examplesData.ts as single source of truth for all examples.
 * Do NOT hardcode examples in this component.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@iconify/react';
import { MANDATE_CATEGORIES, getMandatesByCategory } from '@/data/examplesData';

interface MandateExamplesProps {
  onTryExample: (mandateText: string) => void;
  isModal?: boolean;
}

export default function MandateExamples({ onTryExample, isModal = false }: MandateExamplesProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  // Use centralized function from examplesData.ts
  const filteredExamples = getMandatesByCategory(activeCategory);

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 pb-2">
          {MANDATE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                activeCategory === category.id
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-purple-50'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600">
        Click "Try This" to use an example mandate and see matching results.
      </p>

      {/* Example Cards */}
      <div className={`grid gap-3 ${isModal ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
        {filteredExamples.map((example) => (
          <Card
            key={example.id}
            className="bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-purple-300 transition-all duration-200 group"
          >
            <CardContent className="p-3 sm:p-4">
              {/* Category & Title */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  {example.category}
                </span>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {example.title}
                </h4>
              </div>

              {/* Mandate Text */}
              <p className="text-xs text-gray-600 mb-3 line-clamp-2 italic">
                "{example.mandateText}"
              </p>

              {/* Breakdown */}
              <div className="mb-3 space-y-1">
                {example.breakdown.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-purple-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </div>
                ))}
                {example.breakdown.length > 3 && (
                  <p className="text-xs text-gray-400 pl-4">
                    +{example.breakdown.length - 3} more criteria
                  </p>
                )}
              </div>

              {/* Try Button */}
              <button
                onClick={() => onTryExample(example.mandateText)}
                className="w-full flex items-center justify-center gap-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-md px-3 py-2 text-xs font-semibold transition-colors"
              >
                <span>Try This</span>
                <Icon icon="solar:arrow-right-bold-duotone" className="h-3 w-3" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-400 text-center pt-2">
        Include genre, tone, setting, format, and target audience for best results
      </p>
    </div>
  );
}
