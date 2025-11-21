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
import { Card, CardContent } from '@kstorybridge/ui';
import { ArrowRight, Lightbulb } from 'lucide-react';

interface ExampleCardProps {
  example: CompExample;
  onTryExample: (comps: string[], refinement?: string) => void;
}

export default function ExampleCard({ example, onTryExample }: ExampleCardProps) {
  const handleTryExample = () => {
    onTryExample(example.comps);
  };

  return (
    <Card className="bg-white border border-gray-300 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <CardContent className="p-5">
        {/* Title */}
        <h4 className="text-base font-bold text-gray-900 mb-3 group-hover:text-hanok-teal transition-colors">
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
              <span className="text-hanok-teal mt-0.5">•</span>
              <span className="flex-1">{item}</span>
            </div>
          ))}
        </div>

        {/* Refinement Tips */}
        {example.refinementTips.length > 0 && (
          <div className="mb-4 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-900 mb-1.5">Refine with:</p>
                <div className="flex flex-wrap gap-1.5">
                  {example.refinementTips.map((tip, idx) => (
                    <span
                      key={idx}
                      className="bg-white text-amber-800 px-2 py-0.5 rounded text-xs font-medium border border-amber-200"
                    >
                      "{tip}"
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Try Button */}
        <button
          onClick={handleTryExample}
          className="w-full flex items-center justify-center gap-2 bg-hanok-teal hover:bg-hanok-teal/90 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          <span>Try This Example</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
