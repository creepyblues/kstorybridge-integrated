/**
 * Funnel Metrics Component
 *
 * Internal analytics dashboard for displaying key funnel metrics.
 * Shows KPIs, trends, and performance indicators.
 *
 * @module FunnelMetrics
 * @see docs/tracking/PHASE_1_ANALYTICS.md
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, Target } from 'lucide-react';

export interface MetricData {
  label: string;
  value: string | number;
  change?: number; // Percentage change (positive or negative)
  trend?: 'up' | 'down' | 'stable';
  target?: number; // Target value for comparison
  icon?: any; // Lucide icon component
}

interface FunnelMetricsProps {
  title?: string;
  metrics: MetricData[];
  className?: string;
}

export function FunnelMetrics({
  title = 'Key Metrics',
  metrics,
  className = '',
}: FunnelMetricsProps) {
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4" />;
      case 'down':
        return <ArrowDown className="h-4 w-4" />;
      case 'stable':
        return <Minus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTrendColor = (change?: number) => {
    // Positive change is good for most metrics
    if (change !== undefined && change > 0) return 'text-green-600 bg-green-50';
    if (change !== undefined && change < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatValue = (value: string | number): string => {
    if (typeof value === 'number') {
      // Format large numbers
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <Card className={`bg-white border-gray-300 ${className}`}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg font-bold text-black">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon || Target;
            const trendColor = getTrendColor(metric.change);
            const meetsTarget = metric.target
              ? parseFloat(String(metric.value)) >= metric.target
              : null;

            return (
              <div
                key={index}
                className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">
                      {metric.label}
                    </span>
                  </div>
                  {metric.trend && (
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${trendColor}`}
                    >
                      {getTrendIcon(metric.trend)}
                      {metric.change !== undefined && `${Math.abs(metric.change)}%`}
                    </div>
                  )}
                </div>

                {/* Value */}
                <div className="mb-2">
                  <div className="text-3xl font-bold text-black">
                    {formatValue(metric.value)}
                  </div>
                </div>

                {/* Target Comparison */}
                {metric.target !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          meetsTarget ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            (parseFloat(String(metric.value)) / metric.target) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      Target: {metric.target}
                      {typeof metric.value === 'string' && metric.value.includes('%')
                        ? '%'
                        : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example usage:
 *
 * const conversionMetrics: MetricData[] = [
 *   {
 *     label: 'Signup Conversion',
 *     value: '3.2%',
 *     change: 15,
 *     trend: 'up',
 *     target: 5,
 *     icon: Users,
 *   },
 *   {
 *     label: 'Pro Conversion Rate',
 *     value: '2.6%',
 *     change: 25,
 *     trend: 'up',
 *     target: 2.6,
 *     icon: TrendingUp,
 *   },
 *   {
 *     label: 'Onboarding Completion',
 *     value: '68%',
 *     change: -5,
 *     trend: 'down',
 *     target: 60,
 *     icon: Target,
 *   },
 * ];
 *
 * <FunnelMetrics
 *   title="Conversion Metrics"
 *   metrics={conversionMetrics}
 * />
 */
