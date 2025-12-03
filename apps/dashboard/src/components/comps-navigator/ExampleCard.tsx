/**
 * ExampleCard Component
 *
 * Displays a single comp combination example with:
 * - Title and comp list
 * - Description and breakdown
 * - Refinement tips
 * - "Try This" button to populate form
 */

import { CompExample } from '@/data/examplesData';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface ExampleCardProps {
  example: CompExample;
  onTryExample: (comps: string[], refinement?: string) => void;
  compact?: boolean;
}

export default function ExampleCard({ example, onTryExample, compact = false }: ExampleCardProps) {
  const handleTryExample = () => {
    onTryExample(example.comps);
  };

  // Compact version for modal
  if (compact) {
    return (
      <Card className="bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-hanok-teal/30 transition-all duration-200 group">
        <CardContent className="p-3 sm:p-4">
          {/* Title */}
          <h4 className="text-sm font-bold text-gray-900 mb-2 group-hover:text-hanok-teal transition-colors">
            {example.icon} {example.title}
          </h4>

          {/* Comp Pills */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {example.comps.map((comp, idx) => (
              <span
                key={idx}
                className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded text-xs font-medium border border-cyan-200"
              >
                {comp}
              </span>
            ))}
          </div>

          {/* Short Description */}
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {example.description}
          </p>

          {/* Try Button */}
          <button
            onClick={handleTryExample}
            className="w-full flex items-center justify-center gap-1.5 bg-hanok-teal hover:bg-hanok-teal/90 text-white rounded-md px-3 py-2 text-xs font-semibold transition-colors"
          >
            <span>Try This</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </CardContent>
      </Card>
    );
  }

  // Full version
  return (
    <Card className="bg-white border border-gray-300 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <CardContent className="p-5">
        {/* Title */}
        <h4 className="text-base font-bold text-gray-900 mb-3 group-hover:text-[#4C9C9B] transition-colors">
          {example.icon} {example.title}
        </h4>

        {/* Comp Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {example.comps.map((comp, idx) => (
            <span
              key={idx}
              className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-3 py-1 rounded-lg text-xs font-medium border border-cyan-200"
            >
              {comp}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          {example.description}
        </p>

        {/* Breakdown */}
        <div className="mb-4 space-y-1.5">
          {example.breakdown.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
              <span className="text-[#4C9C9B] mt-0.5">•</span>
              <span className="flex-1">{item}</span>
            </div>
          ))}
        </div>

        {/* Try Button */}
        <button
          onClick={handleTryExample}
          className="w-full flex items-center justify-center gap-2 bg-[#4C9C9B] hover:bg-[#4C9C9B]/90 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          <span>Try This Example</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
