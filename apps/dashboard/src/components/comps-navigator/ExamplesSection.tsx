/**
 * ExamplesSection Component
 *
 * Tabbed interface displaying curated comp combination examples.
 * Helps users learn how to effectively use the Comps Navigator.
 */

import { useState } from 'react';
import { Card, CardContent } from '@kstorybridge/ui';
import { EXAMPLE_CATEGORIES, COMP_EXAMPLES, getExamplesByCategory } from '@/data/examplesData';
import ExampleCard from './ExampleCard';

interface ExamplesSectionProps {
  onTryExample: (comps: string[], refinement?: string) => void;
}

export default function ExamplesSection({ onTryExample }: ExamplesSectionProps) {
  const [activeCategory, setActiveCategory] = useState('genre');

  const categoryExamples = getExamplesByCategory(activeCategory);
  const activeCategoryLabel = EXAMPLE_CATEGORIES.find(c => c.id === activeCategory)?.label || 'Examples';

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm rounded-2xl">
      <CardContent className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Explore Example Combinations
          </h3>
          <p className="text-sm text-gray-600">
            Learn how to combine comps effectively by trying these curated examples
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {EXAMPLE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-hanok-teal text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Description */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">
            {getCategoryDescription(activeCategory)}
          </p>
        </div>

        {/* Example Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryExamples.map((example) => (
            <ExampleCard
              key={example.id}
              example={example}
              onTryExample={onTryExample}
            />
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Click "Try This Example" to auto-populate the search form with comps
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Get description for each category
 */
function getCategoryDescription(categoryId: string): string {
  const descriptions: Record<string, string> = {
    genre: 'Mix different genres to create unique market positioning',
    tone: 'Control the emotional atmosphere and storytelling style',
    theme: 'Target specific subjects, messages, or narrative focuses',
    character: 'Find titles with similar protagonist types and character dynamics',
    production: 'Match budget scale, visual style, and production values',
    format: 'Align with storytelling structure and episode formats'
  };

  return descriptions[categoryId] || 'Explore different comp combination strategies';
}
