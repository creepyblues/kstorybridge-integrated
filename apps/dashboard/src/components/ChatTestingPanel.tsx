import { useState } from 'react';
import { Card, CardContent } from '@kstorybridge/ui';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  price: number;
}

const AI_MODELS: AIModel[] = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', price: 0.15 },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', price: 0.1 },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', price: 0.4 },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', price: 0.05 },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', price: 0.25 },
];

interface ChatTestingPanelProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  vectorSearchLimit: number;
  onVectorSearchLimitChange: (limit: number) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  formattingRules: string;
  onFormattingRulesChange: (rules: string) => void;
  lastRequest?: any;
  lastResponse?: any;
  hasUnappliedChanges?: boolean;
  onApplyChanges?: () => void;
}

export function ChatTestingPanel({
  selectedModel,
  onModelChange,
  vectorSearchLimit,
  onVectorSearchLimitChange,
  systemPrompt,
  onSystemPromptChange,
  formattingRules,
  onFormattingRulesChange,
  lastRequest,
  lastResponse,
  hasUnappliedChanges,
  onApplyChanges,
}: ChatTestingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
      <CardContent className="p-4">
        {/* Header with collapse button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Testing Controls</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500 text-white">
              ADMIN
            </span>

            {/* Apply Changes Button */}
            {hasUnappliedChanges && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyChanges?.();
                }}
                className="px-3 py-1 bg-hanok-teal text-white text-xs font-semibold rounded-lg hover:bg-hanok-teal-600 transition-colors"
              >
                Apply Changes
              </button>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {/* AI Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hanok-teal text-sm"
              >
                {AI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} (${model.price}/1K tokens)
                  </option>
                ))}
              </select>
            </div>

            {/* Vector Search Results Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vector Search Results
              </label>
              <input
                type="number"
                value={vectorSearchLimit}
                onChange={(e) => onVectorSearchLimitChange(parseInt(e.target.value) || 10)}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hanok-teal text-sm"
              />
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => onSystemPromptChange(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hanok-teal text-sm font-mono"
                placeholder="Enter system prompt..."
              />
            </div>

            {/* Formatting Rules */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formatting Rules
              </label>
              <textarea
                value={formattingRules}
                onChange={(e) => onFormattingRulesChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hanok-teal text-sm font-mono"
                placeholder="Enter formatting rules..."
              />
            </div>

            {/* API Request Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last API Request
              </label>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 max-h-64 overflow-auto">
                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                  {lastRequest ? JSON.stringify(lastRequest, null, 2) : 'No request sent yet'}
                </pre>
              </div>
            </div>

            {/* API Response Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last API Response
              </label>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 max-h-64 overflow-auto">
                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                  {lastResponse ? JSON.stringify(lastResponse, null, 2) : 'No response received yet'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
