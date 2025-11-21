/**
 * CompSelector Component
 *
 * Allows users to input 1-3 comparable titles for search.
 * Displays comps as removable chips.
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CompSelectorProps {
  compTitles: string[];
  onChange: (titles: string[]) => void;
  maxComps?: number;
}

export default function CompSelector({ compTitles, onChange, maxComps = 3 }: CompSelectorProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddComp = () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      return;
    }

    if (compTitles.length >= maxComps) {
      return;
    }

    if (compTitles.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      // Duplicate - just clear input
      setInputValue('');
      return;
    }

    onChange([...compTitles, trimmed]);
    setInputValue('');
  };

  const handleRemoveComp = (index: number) => {
    const newTitles = compTitles.filter((_, i) => i !== index);
    onChange(newTitles);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddComp();
    }
  };

  const canAddMore = compTitles.length < maxComps;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900">
          Select up to {maxComps} comparable titles
        </label>
        <span className="text-xs font-medium text-gray-500">
          {compTitles.length} / {maxComps}
        </span>
      </div>

      {/* Comp Chips */}
      {compTitles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {compTitles.map((title, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-100 to-cyan-50 border border-cyan-200 rounded-lg text-sm font-medium text-cyan-800"
            >
              <span>{title}</span>
              <button
                onClick={() => handleRemoveComp(index)}
                className="hover:bg-cyan-200 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${title}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Field */}
      {canAddMore && (
        <div className="flex gap-3">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              compTitles.length === 0
                ? 'e.g., Squid Game, Parasite, Black Mirror...'
                : compTitles.length === 1
                ? 'Add another comp (optional)'
                : 'Add final comp (optional)'
            }
            className="flex-1 border-gray-300 focus:border-hanok-teal focus:ring-hanok-teal"
            maxLength={100}
          />
          <Button
            onClick={handleAddComp}
            disabled={!inputValue.trim()}
            variant="outline"
            className="border-gray-300 hover:bg-gray-100 disabled:opacity-50"
          >
            Add
          </Button>
        </div>
      )}

      {/* Helper Text */}
      {compTitles.length === 0 && (
        <p className="text-xs text-gray-500">
          💡 Tip: Add 2-3 comparable titles for best results. Use well-known Hollywood/global titles.
        </p>
      )}
      {compTitles.length === maxComps && (
        <p className="text-xs font-medium text-gray-600">
          ✓ Maximum {maxComps} comps selected. Click "Find Matches" to search.
        </p>
      )}
    </div>
  );
}
