// Component: MandateInput
// Created: 2025-11-21
// Description: Textarea input for submitting producer mandates

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@iconify/react';

interface MandateInputProps {
  onSubmit: (mandateText: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const MAX_CHARS = 1000;

const PLACEHOLDER_TEXT = `Describe your mandate in detail...

Examples:
• "Looking for action-thriller with strong female lead, Korean setting, suitable for streaming platform, budget under $5M"
• "Need romantic comedy set in modern Seoul, light tone, suitable for theatrical release, targets 20-30 age group"
• "Seeking sci-fi drama with ensemble cast, philosophical themes, premium production value for limited series format"`;

export default function MandateInput({ onSubmit, isLoading = false, disabled = false }: MandateInputProps) {
  const [mandateText, setMandateText] = useState('');

  const remainingChars = MAX_CHARS - mandateText.length;
  const isOverLimit = remainingChars < 0;
  const canSubmit = mandateText.trim().length > 0 && !isOverLimit && !isLoading && !disabled;

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit(mandateText.trim());
      setMandateText('');
    }
  };

  const handleClear = () => {
    setMandateText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="w-full bg-white border-hanok-teal/20 shadow-lg rounded-2xl">
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Describe Your Mandate
            </h3>
            <p className="text-sm text-gray-600">
              Tell us what you're looking for in detail. Be specific about genre, tone, setting, budget, format, or any other requirements.
            </p>
          </div>

          {/* Textarea */}
          <div className="relative">
            <Textarea
              value={mandateText}
              onChange={(e) => setMandateText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER_TEXT}
              disabled={isLoading || disabled}
              className={`min-h-[180px] resize-none text-base leading-relaxed ${
                isOverLimit ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />

            {/* Character counter */}
            <div className={`absolute bottom-3 right-3 text-xs font-medium ${
              isOverLimit ? 'text-red-500' : remainingChars < 100 ? 'text-yellow-600' : 'text-gray-400'
            }`}>
              {remainingChars} / {MAX_CHARS}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> to submit
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={mandateText.length === 0 || isLoading || disabled}
                className="border-gray-300 hover:bg-gray-100"
              >
                <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4 mr-1" />
                Clear
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-hanok-teal hover:bg-hanok-teal/90 text-white h-10 font-semibold disabled:bg-gray-300 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:plain-bold-duotone" className="h-4 w-4 mr-2" />
                    Find Matches
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error message */}
          {isOverLimit && (
            <p className="text-sm text-red-500">
              Your mandate exceeds the {MAX_CHARS} character limit. Please shorten it.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
