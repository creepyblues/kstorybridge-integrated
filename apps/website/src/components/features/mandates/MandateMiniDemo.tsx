import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, FileText, Sparkles, Target } from 'lucide-react';

/**
 * MandateMiniDemo Component
 *
 * Interactive mandate search demo showing:
 * - Text input with cycling placeholder
 * - Example mandate buttons
 * - Search animation and results
 */
export function MandateMiniDemo() {
  const { t } = useTranslation('features');
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const exampleMandates = t('mandates.demo.exampleMandates', { returnObjects: true }) as string[];
  const placeholderText = t('mandates.demo.placeholder');

  // Cycle through placeholders
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % exampleMandates.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [exampleMandates.length]);

  const handleMandateClick = (mandate: string) => {
    if (isSearching) return;

    setInputValue(mandate);
    setIsSearching(true);
    setShowResults(false);

    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
    }, 2000);
  };

  // Auto-trigger first mandate on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleMandateClick(exampleMandates[0]);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const resultTitles = [
    { name: 'The Penthouse', score: 92 },
    { name: 'Money Heist: Korea', score: 88 },
    { name: 'All of Us Are Dead', score: 85 }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-hanok-teal px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-white font-medium text-sm">Mandate Matcher</p>
          <p className="text-white/80 text-xs">Describe your vision</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={exampleMandates[currentPlaceholder]}
            className="w-full h-20 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-hanok-teal/50 focus:border-hanok-teal transition-all"
            disabled={isSearching}
          />
          <button
            className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isSearching
                ? 'bg-hanok-teal/50 cursor-not-allowed'
                : 'bg-hanok-teal hover:bg-hanok-teal-600 cursor-pointer'
            }`}
            disabled={isSearching}
          >
            <Search className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Example Mandates */}
      <div className="px-4 pb-4 bg-white">
        <p className="text-xs text-midnight-ink-600 mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {exampleMandates.slice(0, 2).map((mandate, index) => (
            <button
              key={index}
              onClick={() => handleMandateClick(mandate)}
              disabled={isSearching}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                inputValue === mandate
                  ? 'bg-hanok-teal text-white border-hanok-teal'
                  : 'bg-white text-midnight-ink-600 border-gray-300 hover:border-hanok-teal hover:text-hanok-teal'
              } ${isSearching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {mandate.length > 50 ? mandate.substring(0, 50) + '...' : mandate}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 min-h-[120px]">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative">
              <Search className="h-6 w-6 text-hanok-teal animate-pulse" />
              <div className="absolute inset-0 animate-ping">
                <Search className="h-6 w-6 text-hanok-teal opacity-30" />
              </div>
            </div>
            <p className="text-sm text-midnight-ink-600 mt-2">{t('mandates.demo.resultPreview')}</p>
          </div>
        ) : showResults ? (
          <div className="space-y-3 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-hanok-teal" />
              <span className="text-sm font-medium text-midnight-ink">Top Matches Found</span>
            </div>
            <div className="space-y-2">
              {resultTitles.map((title, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-midnight-ink-600" />
                    <span className="text-sm font-medium text-midnight-ink">{title.name}</span>
                  </div>
                  <span className="text-xs text-hanok-teal bg-hanok-teal/10 px-2 py-0.5 rounded-full font-medium">
                    {title.score}% Match
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 text-midnight-ink-600 text-sm">
            <FileText className="h-5 w-5 mr-2 opacity-50" />
            Describe your mandate to find matches
          </div>
        )}
      </div>
    </div>
  );
}

export default MandateMiniDemo;
