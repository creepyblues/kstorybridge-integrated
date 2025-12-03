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
 */

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText, Search, Loader2, HelpCircle, X } from 'lucide-react';

const EXAMPLE_BRIEFS = [
  'Female-driven thriller with contained locations',
  'Romantic comedy for streaming, completed series',
  'Dark fantasy with strong world-building',
  'Family drama with multi-generational story',
];

interface MandateSearchInputProps {
  onSearch: (mandateText: string) => void;
  onClear: () => void;
  onNeedHelp: () => void;
  isLoading: boolean;
  hasResults: boolean;
  initialValue?: string;
}

export default function MandateSearchInput({
  onSearch,
  onClear,
  onNeedHelp,
  isLoading,
  hasResults,
  initialValue = '',
}: MandateSearchInputProps) {
  const [mandateText, setMandateText] = useState(initialValue);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-2 rounded-full mb-4">
          <FileText className="h-5 w-5 text-purple-500" />
          <span className="text-purple-600 font-medium">Search by Brief</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-black">
          Describe what you're looking for
        </h2>
      </div>

      {/* Search Input */}
      <div className="max-w-2xl mx-auto">
        <Textarea
          value={mandateText}
          onChange={(e) => setMandateText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Describe the content you're looking for...\n\ne.g., Female-driven thriller with contained locations, suitable for limited series adaptation`}
          className="w-full min-h-[120px] text-base py-4 rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500 resize-none"
          disabled={isLoading}
        />

        <div className="flex justify-end gap-2 mt-3">
          {(mandateText.trim() || hasResults) && (
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={isLoading}
              className="border-gray-300 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-2" />
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
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Find Matches
              </>
            )}
          </Button>
        </div>

        {/* Example briefs */}
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-3">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_BRIEFS.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Need help button */}
        <div className="mt-4 text-center">
          <button
            onClick={onNeedHelp}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="underline underline-offset-2">Need help?</span>
          </button>
        </div>
      </div>
    </div>
  );
}
