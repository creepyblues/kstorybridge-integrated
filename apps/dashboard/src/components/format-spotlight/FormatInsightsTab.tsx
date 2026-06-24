import type { FormatAnalysis, FormatType, MicrodramaSpecificInsights } from '@/services/formatFitService';
import { FORMAT_DISPLAY_NAMES } from '@/services/formatFitService';
import { Icon } from '@iconify/react';

interface FormatInsightsTabProps {
  analysis: FormatAnalysis;
  formatType: FormatType;
}

function MicrodramaInsights({ insights }: { insights: MicrodramaSpecificInsights }) {
  return (
    <div className="space-y-3">
      {/* Gauges row */}
      <div className="grid grid-cols-3 gap-3">
        <GaugeItem label="Cliffhanger" value={insights.cliffhanger_potential} />
        <GaugeItem label="Episode Fit" value={insights.episode_structure_fit} />
        <GaugeItem label="Vertical" value={insights.vertical_filming_compatibility} />
      </div>

      {/* Tropes */}
      {insights.trope_alignment && insights.trope_alignment.length > 0 && (
        <div>
          <p className="text-sm font-bold text-gray-900 mb-1.5">Trope Alignment</p>
          <div className="flex flex-wrap gap-1.5">
            {insights.trope_alignment.map((trope, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded-md border border-purple-200"
              >
                {trope}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Platforms */}
      {insights.target_platform_fit && insights.target_platform_fit.length > 0 && (
        <div>
          <p className="text-sm font-bold text-gray-900 mb-1.5">Target Platforms</p>
          <div className="flex flex-wrap gap-1.5">
            {insights.target_platform_fit.map((platform, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-md border border-blue-200"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GaugeItem({ label, value }: { label: string; value: number }) {
  const percentage = Math.min(100, Math.max(0, value));
  const barColor =
    percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-blue-500' : 'bg-gray-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-900">{value}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function FormatInsightsTab({ analysis, formatType }: FormatInsightsTabProps) {
  const formatName = FORMAT_DISPLAY_NAMES[formatType] || formatType;

  // Microdrama with format_specific data
  if (formatType === 'microdrama' && analysis.format_specific) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-gray-900">
          {formatName} Insights
        </p>
        <MicrodramaInsights insights={analysis.format_specific} />
      </div>
    );
  }

  // Fallback: recommendations list
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-bold text-gray-900">
          {formatName} Recommendations
        </p>
        <ul className="space-y-1.5">
          {analysis.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <Icon
                icon="solar:lightbulb-bold-duotone"
                className="h-4 w-4 text-blue-500 mt-0.5 shrink-0"
              />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <p className="text-sm text-gray-400">
      No format-specific insights available for {formatName}.
    </p>
  );
}
