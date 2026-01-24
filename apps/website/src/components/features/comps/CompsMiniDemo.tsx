import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Film, Plus, Search, Sparkles, Check } from 'lucide-react';

/**
 * CompsMiniDemo Component
 *
 * Interactive comp selection demo showing:
 * - Selectable Hollywood title chips
 * - Visual combination effect
 * - Animated results preview
 */
export function CompsMiniDemo() {
  const { t } = useTranslation('features');
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const exampleTitles = t('comps.demo.exampleTitles', { returnObjects: true }) as string[];

  const handleTitleClick = (title: string) => {
    if (isSearching) return;

    if (selectedTitles.includes(title)) {
      setSelectedTitles(selectedTitles.filter(t => t !== title));
      setShowResults(false);
    } else if (selectedTitles.length < 3) {
      const newSelected = [...selectedTitles, title];
      setSelectedTitles(newSelected);

      // If we have at least one selection, trigger search animation
      if (newSelected.length >= 1) {
        setIsSearching(true);
        setTimeout(() => {
          setIsSearching(false);
          setShowResults(true);
        }, 1500);
      }
    }
  };

  // Auto-select first two on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedTitles([exampleTitles[0], exampleTitles[1]]);
      setIsSearching(true);
      setTimeout(() => {
        setIsSearching(false);
        setShowResults(true);
      }, 1500);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-hanok-teal px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <Film className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-white font-medium text-sm">Comps Navigator</p>
          <p className="text-white/80 text-xs">Select up to 3 titles</p>
        </div>
      </div>

      {/* Title Selection */}
      <div className="p-4 bg-gray-50">
        <p className="text-xs text-midnight-ink-600 mb-3">{t('comps.demo.instruction')}</p>
        <div className="flex flex-wrap gap-2">
          {exampleTitles.map((title, index) => (
            <button
              key={index}
              onClick={() => handleTitleClick(title)}
              disabled={isSearching || (selectedTitles.length >= 3 && !selectedTitles.includes(title))}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                selectedTitles.includes(title)
                  ? 'bg-hanok-teal text-white border-hanok-teal'
                  : 'bg-white text-midnight-ink-600 border-gray-300 hover:border-hanok-teal hover:text-hanok-teal'
              } ${isSearching || (selectedTitles.length >= 3 && !selectedTitles.includes(title)) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {selectedTitles.includes(title) ? (
                <Check className="h-3 w-3" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              {title}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Combination */}
      {selectedTitles.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-center gap-2 text-sm text-midnight-ink-600">
            {selectedTitles.map((title, index) => (
              <span key={index} className="flex items-center gap-2">
                <span className="font-medium text-midnight-ink">{title}</span>
                {index < selectedTitles.length - 1 && (
                  <Plus className="h-4 w-4 text-hanok-teal" />
                )}
              </span>
            ))}
            <span className="mx-2">=</span>
            <span className="text-hanok-teal font-medium">?</span>
          </div>
        </div>
      )}

      {/* Search/Results */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 min-h-[100px]">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-4 animate-pulse">
            <Search className="h-6 w-6 text-hanok-teal mb-2" />
            <p className="text-sm text-midnight-ink-600">{t('comps.demo.resultPreview')}</p>
          </div>
        ) : showResults ? (
          <div className="space-y-3 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-hanok-teal" />
              <span className="text-sm font-medium text-midnight-ink">3 Korean Titles Found</span>
            </div>
            <div className="space-y-2">
              {['The Glory', 'Sweet Home', 'Vincenzo'].map((title, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="text-sm font-medium text-midnight-ink">{title}</span>
                  <span className="text-xs text-hanok-teal bg-hanok-teal/10 px-2 py-0.5 rounded-full">
                    {95 - index * 3}% Match
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-midnight-ink-600 text-center">
              {t('comps.demo.matchExplanation')}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 text-midnight-ink-600 text-sm">
            Select titles above to find matches
          </div>
        )}
      </div>
    </div>
  );
}

export default CompsMiniDemo;
