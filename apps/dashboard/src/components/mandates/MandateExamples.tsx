/**
 * MandateExamples Component
 *
 * Displays curated mandate examples in the "Need help" modal.
 * Shows detailed examples with explanations to help users understand
 * how to write effective mandate descriptions.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@iconify/react';

interface MandateExample {
  id: string;
  category: string;
  title: string;
  mandateText: string;
  breakdown: string[];
}

const MANDATE_EXAMPLES: MandateExample[] = [
  {
    id: 'thriller-1',
    category: 'Thriller',
    title: 'Female-Led Action Thriller',
    mandateText: 'Looking for action-thriller with strong female lead, Korean setting, suitable for streaming platform, budget under $5M',
    breakdown: [
      'Genre: Action-thriller',
      'Protagonist: Strong female lead',
      'Setting: Korean location',
      'Distribution: Streaming-ready',
      'Budget: Under $5M production',
    ],
  },
  {
    id: 'romance-1',
    category: 'Romance',
    title: 'Modern Seoul Rom-Com',
    mandateText: 'Need romantic comedy set in modern Seoul, light tone, suitable for theatrical release, targets 20-30 age group',
    breakdown: [
      'Genre: Romantic comedy',
      'Setting: Contemporary Seoul',
      'Tone: Light and fun',
      'Distribution: Theatrical potential',
      'Audience: Young adults (20-30)',
    ],
  },
  {
    id: 'scifi-1',
    category: 'Sci-Fi',
    title: 'Philosophical Sci-Fi Drama',
    mandateText: 'Seeking sci-fi drama with ensemble cast, philosophical themes, premium production value for limited series format',
    breakdown: [
      'Genre: Sci-fi drama',
      'Cast: Ensemble structure',
      'Themes: Philosophical depth',
      'Quality: Premium production',
      'Format: Limited series',
    ],
  },
  {
    id: 'fantasy-1',
    category: 'Fantasy',
    title: 'Dark Fantasy Epic',
    mandateText: 'Dark fantasy with strong world-building, completed source material, suitable for multi-season adaptation',
    breakdown: [
      'Genre: Dark fantasy',
      'World: Rich world-building',
      'Source: Complete story',
      'Potential: Multi-season arc',
    ],
  },
  {
    id: 'drama-1',
    category: 'Drama',
    title: 'Family Generational Saga',
    mandateText: 'Family drama with multi-generational story, emotional depth, Korean cultural elements, suitable for international audience',
    breakdown: [
      'Genre: Family drama',
      'Scope: Multi-generational',
      'Tone: Emotionally rich',
      'Culture: Korean heritage',
      'Appeal: International market',
    ],
  },
  {
    id: 'horror-1',
    category: 'Horror',
    title: 'Psychological Horror',
    mandateText: 'Psychological horror with supernatural elements, contained setting, suitable for theatrical release, targets mature audience',
    breakdown: [
      'Genre: Psychological horror',
      'Elements: Supernatural',
      'Setting: Contained/isolated',
      'Distribution: Theatrical',
      'Audience: Mature viewers',
    ],
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'Thriller', label: 'Thriller' },
  { id: 'Romance', label: 'Romance' },
  { id: 'Sci-Fi', label: 'Sci-Fi' },
  { id: 'Fantasy', label: 'Fantasy' },
  { id: 'Drama', label: 'Drama' },
  { id: 'Horror', label: 'Horror' },
];

interface MandateExamplesProps {
  onTryExample: (mandateText: string) => void;
  isModal?: boolean;
}

export default function MandateExamples({ onTryExample, isModal = false }: MandateExamplesProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredExamples = activeCategory === 'all'
    ? MANDATE_EXAMPLES
    : MANDATE_EXAMPLES.filter(e => e.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 pb-2">
          {CATEGORIES.map((category) => (
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
