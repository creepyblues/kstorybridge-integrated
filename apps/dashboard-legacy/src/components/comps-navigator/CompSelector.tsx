/**
 * CompSelector Component
 *
 * Allows users to input 1-3 comparable titles for search.
 * Displays comps as removable chips.
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Input } from '@kstorybridge/ui';

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
      {/* Input Field First */}
      {canAddMore && (
        <div className="flex gap-3">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a comparable title (e.g., Squid Game, Parasite, Black Mirror)"
            className="flex-1 border-gray-300 focus:border-hanok-teal focus:ring-hanok-teal text-base h-12"
            maxLength={100}
          />
          <Button
            onClick={handleAddComp}
            disabled={!inputValue.trim()}
            className="bg-hanok-teal hover:bg-hanok-teal/90 text-white h-12 px-6 font-medium disabled:opacity-50 disabled:bg-gray-300"
          >
            Add
          </Button>
        </div>
      )}

      {/* Title and Counter */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Select up to {maxComps} comparable titles
        </label>
        <span className="text-xs font-medium text-gray-500">
          {compTitles.length} / {maxComps} selected
        </span>
      </div>

      {/* Comp Chips */}
      {compTitles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {compTitles.map((title, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-100 to-cyan-50 border border-cyan-200 rounded-lg text-sm font-medium text-cyan-800 shadow-sm"
            >
              <span>{title}</span>
              <button
                onClick={() => handleRemoveComp(index)}
                className="hover:bg-cyan-200 rounded-full p-1 transition-colors"
                aria-label={`Remove ${title}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {compTitles.length === maxComps && (
        <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          ✓ Ready to search with {maxComps} comps
        </p>
      )}
    </div>
  );
}
