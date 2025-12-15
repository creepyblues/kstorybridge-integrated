/**
 * ChatProcessingStatus Component
 *
 * Claude-style processing status timeline that shows users what's happening
 * while waiting for AI responses. Displays phase progression with result count.
 */

import { Icon } from '@iconify/react';
import { ChatPhase } from '@/services/chatOrchestratorService';

interface ChatProcessingStatusProps {
  phase: ChatPhase;
  searchCount?: number;
}

interface PhaseItemProps {
  label: string;
  completedLabel?: string;
  icon: string;
  isActive: boolean;
  isCompleted: boolean;
  detail?: string;
}

function PhaseItem({ label, completedLabel, icon, isActive, isCompleted, detail }: PhaseItemProps) {
  return (
    <div className={`flex items-center gap-2 transition-all duration-300 ${
      isCompleted ? 'text-gray-400' : isActive ? 'text-gray-700' : 'text-gray-300'
    }`}>
      {/* Status indicator */}
      {isCompleted ? (
        <Icon
          icon="solar:check-circle-bold"
          className="h-4 w-4 text-green-500 flex-shrink-0"
        />
      ) : isActive ? (
        <span className="relative flex h-4 w-4 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hanok-teal opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-hanok-teal"></span>
        </span>
      ) : (
        <span className="h-4 w-4 rounded-full border-2 border-gray-200 flex-shrink-0"></span>
      )}

      {/* Icon */}
      <Icon
        icon={icon}
        className={`h-4 w-4 flex-shrink-0 ${
          isActive ? 'text-hanok-teal' : ''
        }`}
      />

      {/* Label */}
      <span className="text-sm font-medium">
        {isCompleted && completedLabel ? completedLabel : label}
        {detail && isActive && (
          <span className="ml-1 text-hanok-teal font-semibold">{detail}</span>
        )}
        {detail && isCompleted && (
          <span className="ml-1 text-gray-500">{detail}</span>
        )}
      </span>
    </div>
  );
}

export default function ChatProcessingStatus({ phase, searchCount }: ChatProcessingStatusProps) {
  if (!phase) return null;

  // Determine phase states
  const isAnalyzing = phase === 'analyzing';
  const isSearching = phase === 'searching';
  const isGenerating = phase === 'generating';
  const isComplete = phase === 'complete';

  const analyzingCompleted = isSearching || isGenerating || isComplete;
  const searchingCompleted = isGenerating || isComplete;
  const generatingCompleted = isComplete;

  // Build search detail string
  const searchDetail = searchCount !== undefined && searchCount > 0
    ? `Found ${searchCount} titles`
    : undefined;

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 max-w-sm">
        <div className="space-y-2">
          <PhaseItem
            label="Analyzing your request..."
            completedLabel="Analyzed"
            icon="solar:magnifer-bold-duotone"
            isActive={isAnalyzing}
            isCompleted={analyzingCompleted}
          />

          {(isSearching || searchingCompleted) && (
            <PhaseItem
              label="Searching database..."
              completedLabel="Search complete"
              icon="solar:database-bold-duotone"
              isActive={isSearching}
              isCompleted={searchingCompleted}
              detail={searchDetail}
            />
          )}

          {(isGenerating || generatingCompleted) && (
            <PhaseItem
              label="Generating response..."
              completedLabel="Response ready"
              icon="solar:pen-new-square-bold-duotone"
              isActive={isGenerating}
              isCompleted={generatingCompleted}
            />
          )}
        </div>
      </div>
    </div>
  );
}
