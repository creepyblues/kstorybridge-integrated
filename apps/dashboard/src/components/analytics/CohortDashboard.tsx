/**
 * Cohort Dashboard Component
 *
 * Internal analytics component for cohort analysis and retention tracking.
 * Shows retention curves, engagement heatmap, and cohort comparison.
 *
 * @module CohortDashboard
 * @see docs/tracking/PHASE_1_ANALYTICS.md
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@iconify/react';

export interface CohortData {
  cohortName: string; // e.g., "Week of Jan 1, 2025"
  cohortDate: string; // ISO date string
  totalUsers: number;
  day1Retention: number; // Percentage (0-100)
  day7Retention: number;
  day30Retention: number;
  avgEngagementScore?: number; // Optional engagement metric
}

interface CohortDashboardProps {
  title?: string;
  cohorts: CohortData[];
  className?: string;
}

export function CohortDashboard({
  title = 'Cohort Analysis',
  cohorts,
  className = '',
}: CohortDashboardProps) {
  // Calculate average retention across all cohorts
  const avgRetention = {
    day1:
      cohorts.length > 0
        ? cohorts.reduce((sum, c) => sum + c.day1Retention, 0) / cohorts.length
        : 0,
    day7:
      cohorts.length > 0
        ? cohorts.reduce((sum, c) => sum + c.day7Retention, 0) / cohorts.length
        : 0,
    day30:
      cohorts.length > 0
        ? cohorts.reduce((sum, c) => sum + c.day30Retention, 0) / cohorts.length
        : 0,
  };

  const getRetentionColor = (retention: number): string => {
    if (retention >= 70) return 'bg-green-500';
    if (retention >= 50) return 'bg-yellow-500';
    if (retention >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRetentionTextColor = (retention: number): string => {
    if (retention >= 70) return 'text-green-600';
    if (retention >= 50) return 'text-yellow-600';
    if (retention >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className={`bg-white border-gray-300 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-black">{title}</CardTitle>
        <p className="text-sm text-gray-600">
          Track user retention by signup cohort
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="solar:calendar-bold-duotone" className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Day 1 Retention</span>
            </div>
            <div className={`text-3xl font-bold ${getRetentionTextColor(avgRetention.day1)}`}>
              {avgRetention.day1.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Average across all cohorts</div>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="solar:graph-up-bold-duotone" className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Day 7 Retention</span>
            </div>
            <div className={`text-3xl font-bold ${getRetentionTextColor(avgRetention.day7)}`}>
              {avgRetention.day7.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Average across all cohorts</div>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="solar:users-group-rounded-bold-duotone" className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Day 30 Retention</span>
            </div>
            <div className={`text-3xl font-bold ${getRetentionTextColor(avgRetention.day30)}`}>
              {avgRetention.day30.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Average across all cohorts</div>
          </div>
        </div>

        {/* Retention Heatmap Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left p-3 text-sm font-semibold text-gray-700">
                  Cohort
                </th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">
                  Users
                </th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">
                  Day 1
                </th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">
                  Day 7
                </th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">
                  Day 30
                </th>
                {cohorts.some(c => c.avgEngagementScore !== undefined) && (
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">
                    Engagement
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3">
                    <div className="font-medium text-black">{cohort.cohortName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(cohort.cohortDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-3 text-right font-semibold text-black">
                    {cohort.totalUsers.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getRetentionColor(
                          cohort.day1Retention
                        )}`}
                      />
                      <span className="text-sm font-semibold text-black">
                        {cohort.day1Retention.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getRetentionColor(
                          cohort.day7Retention
                        )}`}
                      />
                      <span className="text-sm font-semibold text-black">
                        {cohort.day7Retention.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getRetentionColor(
                          cohort.day30Retention
                        )}`}
                      />
                      <span className="text-sm font-semibold text-black">
                        {cohort.day30Retention.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  {cohort.avgEngagementScore !== undefined && (
                    <td className="p-3 text-center">
                      <span className="text-sm font-semibold text-black">
                        {cohort.avgEngagementScore.toFixed(1)}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-300">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="font-semibold">Retention Color Key:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>≥70%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>50-69%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>30-49%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>&lt;30%</span>
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
 * const cohortData: CohortData[] = [
 *   {
 *     cohortName: 'Week of Jan 1',
 *     cohortDate: '2025-01-01',
 *     totalUsers: 1250,
 *     day1Retention: 85,
 *     day7Retention: 68,
 *     day30Retention: 42,
 *     avgEngagementScore: 7.5,
 *   },
 *   {
 *     cohortName: 'Week of Jan 8',
 *     cohortDate: '2025-01-08',
 *     totalUsers: 1480,
 *     day1Retention: 82,
 *     day7Retention: 65,
 *     day30Retention: 38,
 *     avgEngagementScore: 6.8,
 *   },
 * ];
 *
 * <CohortDashboard
 *   title="User Retention by Cohort"
 *   cohorts={cohortData}
 * />
 */
