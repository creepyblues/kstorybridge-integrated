import React from 'react';
import { Icon } from '@iconify/react';
import type { MarketingAsset, GenerationStatsData } from '@/types/asset-generation';
import { Card, CardContent } from "@/components/ui/card";

interface GenerationStatsProps {
  assets: MarketingAsset[];
}

/**
 * GenerationStats Component
 * Displays statistics about asset generation progress and costs
 */
export function GenerationStats({ assets }: GenerationStatsProps) {
  const stats: GenerationStatsData = React.useMemo(() => {
    const total_assets = assets.length;
    const pending_count = assets.filter((a) => a.status === 'pending').length;
    const generating_count = assets.filter((a) => a.status === 'generating').length;
    const completed_count = assets.filter((a) => a.status === 'completed').length;
    const failed_count = assets.filter((a) => a.status === 'failed').length;

    // Calculate total cost (only from completed assets)
    const total_cost = assets
      .filter((a) => a.status === 'completed')
      .reduce((sum, a) => sum + a.generation_cost, 0);

    // Estimate remaining cost (assuming standard quality at $0.08 per image)
    const estimated_remaining_cost = pending_count * 0.08;

    return {
      total_assets,
      pending_count,
      generating_count,
      completed_count,
      failed_count,
      total_cost,
      estimated_remaining_cost,
    };
  }, [assets]);

  const statCards = [
    {
      title: 'Total Assets',
      value: stats.total_assets,
      icon: 'solar:graph-up-bold-duotone',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
    },
    {
      title: 'Completed',
      value: stats.completed_count,
      icon: 'solar:check-circle-bold-duotone',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Generating',
      value: stats.generating_count,
      icon: 'solar:refresh-circle-bold-duotone',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      animate: stats.generating_count > 0,
    },
    {
      title: 'Pending',
      value: stats.pending_count,
      icon: 'solar:clock-circle-bold-duotone',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      title: 'Failed',
      value: stats.failed_count,
      icon: 'solar:close-circle-bold-duotone',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Total Cost',
      value: `$${stats.total_cost.toFixed(2)}`,
      icon: 'solar:dollar-bold-duotone',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          return (
            <Card
              key={stat.title}
              className="bg-transparent border-gray-300 shadow-none rounded-2xl"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon
                      icon={stat.icon}
                      className={`w-5 h-5 ${stat.color} ${
                        stat.animate ? 'animate-spin' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
                    <p className="text-xl font-bold text-black">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cost Breakdown */}
      {(stats.total_cost > 0 || stats.estimated_remaining_cost > 0) && (
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black mb-1">Cost Breakdown</p>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>Spent: ${stats.total_cost.toFixed(2)}</span>
                  <span>·</span>
                  <span>Estimated Remaining: ${stats.estimated_remaining_cost.toFixed(2)}</span>
                  <span>·</span>
                  <span className="font-semibold text-black">
                    Total Projected: ${(stats.total_cost + stats.estimated_remaining_cost).toFixed(2)}
                  </span>
                </div>
              </div>
              {stats.pending_count > 0 && (
                <div className="text-xs text-gray-500">
                  ({stats.pending_count} pending × ~$0.08 avg)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      {stats.total_assets > 0 && (
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-black">Generation Progress</span>
                <span className="text-gray-600">
                  {stats.completed_count} / {stats.total_assets} completed
                  ({Math.round((stats.completed_count / stats.total_assets) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(stats.completed_count / stats.total_assets) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
