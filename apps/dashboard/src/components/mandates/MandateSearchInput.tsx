/**
 * MandateSearchInput Component
 *
 * Search input styled after Home page's BriefSearch design.
 * Includes:
 * - Header with badge
 * - Textarea for mandate description
 * - Find Matches button
 * - Try examples pills
 * - Need help? button
 *
 * IMPORTANT: Uses examplesData.ts as single source of truth for examples.
 * Do NOT hardcode examples in this component.
 */

import { useState, useEffect, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { getRandomMandates } from '@/data/examplesData';
import { MandateTiming } from '@/services/mandateService';

interface MandateSearchInputProps {
  onSearch: (mandateText: string) => void;
  onClear: () => void;
  onNeedHelp: () => void;
  isLoading: boolean;
  hasResults: boolean;
  initialValue?: string;
  timing?: MandateTiming | null;
}

export default function MandateSearchInput({
  onSearch,
  onClear,
  onNeedHelp: _onNeedHelp, // Reserved for future "Need Help" button
  isLoading,
  hasResults,
  initialValue = '',
  timing,
}: MandateSearchInputProps) {
  const [mandateText, setMandateText] = useState(initialValue);

  // Use centralized suggestion data from examplesData.ts
  const exampleBriefs = useMemo(() =>
    getRandomMandates(3).map(m => m.mandateText),
    []
  );

  // Update mandate text when initialValue changes
  useEffect(() => {
    if (initialValue) {
      setMandateText(initialValue);
    }
  }, [initialValue]);

  const handleSearch = () => {
    if (mandateText.trim()) {
      onSearch(mandateText.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setMandateText(example);
    onSearch(example);
  };

  const handleClear = () => {
    setMandateText('');
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && mandateText.trim()) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">
          Describe what you're looking for
        </h2>
      </div>

      {/* Search Input */}
      <div className="max-w-2xl mx-auto">
        <Textarea
          value={mandateText}
          onChange={(e) => setMandateText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[48px] text-base py-3 px-4 rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500 resize-none"
          disabled={isLoading}
          rows={1}
        />

        <div className="flex justify-end gap-2 mt-3">
          {(mandateText.trim() || hasResults) && (
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={isLoading}
              className="border-gray-300 hover:bg-gray-100"
            >
              <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
          <Button
            onClick={handleSearch}
            disabled={isLoading || !mandateText.trim()}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            {isLoading ? (
              <>
                <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 animate-spin mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Icon icon="solar:magnifer-bold-duotone" className="h-4 w-4 mr-2" />
                Find Matches
              </>
            )}
          </Button>
        </div>

        {/* Example briefs */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">Try asking:</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {exampleBriefs.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                disabled={isLoading}
                className="px-2.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Timing breakdown - show after search completes */}
        {timing && !isLoading && (
          <div className="mt-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <Icon icon="solar:cpu-bolt-bold-duotone" className="h-3 w-3" />
                Embed: {(timing.embedding_ms / 1000).toFixed(1)}s
              </span>
              <span>→</span>
              <span className="flex items-center gap-1">
                <Icon icon="solar:database-bold-duotone" className="h-3 w-3" />
                Search: {(timing.vector_search_ms / 1000).toFixed(1)}s
              </span>
              <span>→</span>
              <span className="flex items-center gap-1">
                <Icon icon="solar:magic-stick-3-bold-duotone" className="h-3 w-3" />
                AI: {(timing.ai_explanation_ms / 1000).toFixed(1)}s
              </span>
              <span>→</span>
              <span className="font-medium text-gray-500">
                Total: {(timing.total_ms / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
