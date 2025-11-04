/**
 * Funnel Visualization Component
 *
 * Internal analytics component for visualizing conversion funnels.
 * Shows step-by-step conversion rates and drop-off points.
 *
 * @module FunnelVisualization
 * @see docs/tracking/PHASE_1_ANALYTICS.md
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface FunnelStep {
  name: string;
  count: number;
  percentage?: number;
}

interface FunnelVisualizationProps {
  title: string;
  steps: FunnelStep[];
  className?: string;
}

export function FunnelVisualization({
  title,
  steps,
  className = '',
}: FunnelVisualizationProps) {
  // Calculate percentages and drop-off rates
  const totalUsers = steps[0]?.count || 0;
  const stepsWithMetrics = steps.map((step, index) => {
    const percentage = totalUsers > 0 ? (step.count / totalUsers) * 100 : 0;
    const previousCount = index > 0 ? steps[index - 1].count : totalUsers;
    const dropOffCount = previousCount - step.count;
    const dropOffRate = previousCount > 0 ? (dropOffCount / previousCount) * 100 : 0;

    return {
      ...step,
      percentage,
      dropOffCount,
      dropOffRate,
      conversionFromPrevious: previousCount > 0 ? (step.count / previousCount) * 100 : 0,
    };
  });

  const overallConversion =
    steps.length > 0 && totalUsers > 0
      ? ((steps[steps.length - 1].count / totalUsers) * 100).toFixed(1)
      : '0';

  return (
    <Card className={`bg-white border-gray-300 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-black">{title}</CardTitle>
        <p className="text-sm text-gray-600">
          Overall Conversion: <span className="font-bold text-black">{overallConversion}%</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stepsWithMetrics.map((step, index) => {
            const isFirst = index === 0;
            const isLast = index === steps.length - 1;
            const isBottleneck = !isFirst && step.dropOffRate > 30; // Highlight if >30% drop-off

            return (
              <div key={step.name} className="relative">
                {/* Step Card */}
                <div
                  className={`p-4 rounded-lg border-2 ${
                    isBottleneck
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-500">
                        Step {index + 1}
                      </span>
                      <span className="text-base font-bold text-black">{step.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-black">
                        {step.count.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {step.percentage.toFixed(1)}% of total
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isBottleneck ? 'bg-red-500' : 'bg-hanok-teal'
                      }`}
                      style={{ width: `${step.percentage}%` }}
                    />
                  </div>

                  {/* Conversion from previous step */}
                  {!isFirst && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        Conversion from previous:{' '}
                        <span
                          className={`font-semibold ${
                            step.conversionFromPrevious >= 70
                              ? 'text-green-600'
                              : step.conversionFromPrevious >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {step.conversionFromPrevious.toFixed(1)}%
                        </span>
                      </span>
                      {isBottleneck && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">
                          ⚠️ Bottleneck
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Drop-off Indicator */}
                {!isLast && (
                  <div className="flex items-center justify-center my-1">
                    <div className="text-xs text-gray-500">
                      {step.dropOffCount > 0 && (
                        <>
                          ↓ <span className="font-semibold">{step.dropOffCount.toLocaleString()}</span> dropped
                          ({step.dropOffRate.toFixed(1)}%)
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500">Started</div>
              <div className="text-xl font-bold text-black">{totalUsers.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-xl font-bold text-black">
                {steps[steps.length - 1]?.count.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Conversion Rate</div>
              <div className="text-xl font-bold text-hanok-teal">{overallConversion}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example usage:
 *
 * const onboardingFunnel: FunnelStep[] = [
 *   { name: 'Signup', count: 1000 },
 *   { name: 'Onboarding Started', count: 750 },
 *   { name: 'First Search', count: 600 },
 *   { name: 'First Save', count: 450 },
 *   { name: 'First Pitch View', count: 180 },
 * ];
 *
 * <FunnelVisualization
 *   title="Onboarding Funnel"
 *   steps={onboardingFunnel}
 * />
 */
