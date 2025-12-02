import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Film, FileText, TrendingUp, ArrowRight, Search, Loader2, Tv, ExternalLink } from 'lucide-react';
import { omdbService, OMDBSearchResult } from '@/services/omdbService';
import type { HomeMode } from '@/pages/buyers/Home';

interface HeroSectionProps {
  onModeChange: (mode: HomeMode) => void;
  onShowCompSearch?: (query: string) => void;
  onBriefSearch?: (query: string) => void;
}

export function HeroSection({ onModeChange, onShowCompSearch, onBriefSearch }: HeroSectionProps) {
  const [showInput, setShowInput] = useState('');
  const [briefInput, setBriefInput] = useState('');

  // OMDB autocomplete state
  const [suggestions, setSuggestions] = useState<OMDBSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search effect
  useEffect(() => {
    const trimmed = showInput.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const results = await omdbService.searchTitles(trimmed);
      setSuggestions(results.slice(0, 5)); // Max 5 suggestions
      setShowDropdown(results.length > 0);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [showInput]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelectSuggestion = (result: OMDBSearchResult) => {
    setShowInput(result.Title);
    setShowDropdown(false);
    setSuggestions([]);
    // Trigger search immediately
    if (onShowCompSearch) {
      onShowCompSearch(result.Title);
    } else {
      onModeChange('show-comp');
    }
  };

  const handleShowCompSubmit = () => {
    if (showInput.trim() && onShowCompSearch) {
      onShowCompSearch(showInput.trim());
    } else if (showInput.trim()) {
      onModeChange('show-comp');
    }
  };

  const handleBriefSubmit = () => {
    if (briefInput.trim() && onBriefSearch) {
      onBriefSearch(briefInput.trim());
    } else if (briefInput.trim()) {
      onModeChange('brief');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: I have a show I like */}
      <Card className="bg-white border-2 border-hanok-teal rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardContent className="p-6">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-hanok-teal/10 flex items-center justify-center mb-5">
            <div className="relative">
              <Film className="h-7 w-7 text-hanok-teal" />
              <Search className="h-4 w-4 text-hanok-teal absolute -bottom-1 -right-1" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-black mb-2">
            I have a<br />show I like.
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-5">
            Find Korean IP similar to a show you love.
          </p>

          {/* Input with Autocomplete */}
          <div className="relative mb-4" ref={dropdownRef}>
            <div className="relative">
              <Input
                value={showInput}
                onChange={(e) => setShowInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (showDropdown && suggestions.length > 0) {
                      handleSelectSuggestion(suggestions[0]);
                    } else {
                      handleShowCompSubmit();
                    }
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="e.g., 'The Bear', 'Squid Game'"
                className="border-gray-300 focus:border-hanok-teal focus:ring-hanok-teal pr-8"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {suggestions.map((result) => (
                  <div
                    key={result.imdbID}
                    onClick={() => handleSelectSuggestion(result)}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {result.Type === 'series' ? (
                        <Tv className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      ) : (
                        <Film className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-gray-900 truncate text-sm">{result.Title}</span>
                      <span className="text-gray-500 text-xs flex-shrink-0">({result.Year})</span>
                    </div>
                    <a
                      href={omdbService.getIMDBUrl(result.imdbID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-yellow-500 transition-colors flex-shrink-0 ml-2"
                      title="View on IMDB"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Button */}
          <Button
            onClick={handleShowCompSubmit}
            className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white font-medium"
          >
            FIND SIMILAR IP
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Card 2: I have a brief */}
      <Card className="bg-white border-2 border-purple-500 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardContent className="p-6">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-5">
            <FileText className="h-7 w-7 text-purple-500" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-black mb-2">
            I have<br />a brief.
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-5">
            Describe what you're looking for.
          </p>

          {/* Input */}
          <Textarea
            value={briefInput}
            onChange={(e) => setBriefInput(e.target.value)}
            placeholder="e.g., 'Female-driven thriller'"
            className="mb-4 border-gray-300 focus:border-purple-500 focus:ring-purple-500 min-h-[42px] resize-none"
            rows={1}
          />

          {/* Button */}
          <Button
            onClick={handleBriefSubmit}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium"
          >
            SEARCH BY BRIEF
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Card 3: What's hot now */}
      <Card className="bg-white border-2 border-orange-500 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardContent className="p-6">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-5">
            <TrendingUp className="h-7 w-7 text-orange-500" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-black mb-2">
            What's<br />hot now.
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-5">
            See trending Korean IP ready for adaptation.
          </p>

          {/* Placeholder text matching input height */}
          <div className="mb-4 py-2.5 px-3 text-sm text-gray-400 border border-transparent">
            Curated picks with high market potential
          </div>

          {/* Button */}
          <Button
            onClick={() => onModeChange('hot-now')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium"
          >
            VIEW TRENDING
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
