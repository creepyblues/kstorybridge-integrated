import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Input, Button, Badge } from '@kstorybridge/ui';
import { searchAnalyticsService } from '@/services/searchAnalyticsService';
import { enhancedTitleSearchService } from '@/services/enhancedTitleSearchService';
import { Search, Clock, TrendingUp, Lightbulb, X } from 'lucide-react';
import { debounce } from 'lodash';

interface SmartSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  userId?: string;
  className?: string;
}

interface SearchSuggestion {
  text: string;
  type: 'autocomplete' | 'similar' | 'trending' | 'recent';
  icon: React.ReactNode;
  confidence?: number;
}

export const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search titles, genres, themes...",
  userId,
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Generate suggestions
  const generateSuggestionsInternal = useCallback(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        // Show recent searches when no query
        const recentSuggestions: SearchSuggestion[] = recentSearches.map(search => ({
          text: search,
          type: 'recent',
          icon: <Clock className="h-3 w-3" />
        }));
        setSuggestions(recentSuggestions);
        return;
      }

      setIsLoading(true);

      try {
        const [autocompleteSuggestions, enhancedSuggestions] = await Promise.all([
          searchAnalyticsService.getAutocompleteSuggestions(query, userId),
          enhancedTitleSearchService.getSearchSuggestions(query)
        ]);

        const suggestionList: SearchSuggestion[] = [
          // Autocomplete suggestions from search history
          ...autocompleteSuggestions.slice(0, 3).map(text => ({
            text,
            type: 'autocomplete' as const,
            icon: <Search className="h-3 w-3" />
          })),
          
          // Enhanced suggestions from vector search
          ...enhancedSuggestions.slice(0, 3).map(text => ({
            text,
            type: 'similar' as const,
            icon: <Lightbulb className="h-3 w-3" />
          }))
        ];

        // Add trending suggestions if available
        // This would require additional API endpoint
        const trendingSuggestions: SearchSuggestion[] = [
          // Mock trending data - replace with real trending queries
          ...(query.length > 3 ? [
            { text: query + ' romance', type: 'trending' as const, icon: <TrendingUp className="h-3 w-3" /> },
            { text: query + ' webtoon', type: 'trending' as const, icon: <TrendingUp className="h-3 w-3" /> }
          ] : [])
        ];

        setSuggestions([...suggestionList, ...trendingSuggestions].slice(0, 8));
      } catch (error) {
        console.warn('Failed to generate suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
  }, [userId, recentSearches]);

  const generateSuggestions = useMemo(
    () => debounce(generateSuggestionsInternal, 300),
    [generateSuggestionsInternal]
  );

  // Handle input change
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setSelectedSuggestionIndex(-1);
    
    if (newValue.trim()) {
      generateSuggestions(newValue);
      setShowSuggestions(true);
    } else {
      generateSuggestions(''); // Show recent searches
      setShowSuggestions(true);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    saveRecentSearch(suggestion.text);
    onSearch(suggestion.text);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        setShowSuggestions(false);
        saveRecentSearch(value);
        onSearch(value);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          setShowSuggestions(false);
          saveRecentSearch(value);
          onSearch(value);
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Handle search button click
  const handleSearch = () => {
    setShowSuggestions(false);
    saveRecentSearch(value);
    onSearch(value);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    setSuggestions([]);
  };

  // Remove individual suggestion
  const removeSuggestion = useCallback((suggestionText: string, suggestionType: string) => {
    if (suggestionType === 'recent') {
      // Remove from recent searches
      const updated = recentSearches.filter(search => search !== suggestionText);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));

      // Update current suggestions
      setSuggestions(prev => prev.filter(s => s.text !== suggestionText));
    } else {
      // For other types, just remove from current suggestions
      setSuggestions(prev => prev.filter(s => s.text !== suggestionText));
    }
  }, [recentSearches]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'autocomplete': return 'History';
      case 'similar': return 'Similar';
      case 'trending': return 'Trending';
      case 'recent': return 'Recent';
      default: return '';
    }
  };

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'autocomplete': return 'bg-blue-100 text-blue-800';
      case 'similar': return 'bg-purple-100 text-purple-800';
      case 'trending': return 'bg-orange-100 text-orange-800';
      case 'recent': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 || !value) {
              generateSuggestions(value);
              setShowSuggestions(true);
            }
          }}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSearch}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {isLoading && (
            <div className="p-3 text-center text-sm text-gray-500">
              <Search className="h-4 w-4 animate-spin inline mr-2" />
              Finding suggestions...
            </div>
          )}
          
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.text}`}
              className={`px-3 py-2 flex items-center justify-between hover:bg-gray-50 group ${
                selectedSuggestionIndex === index ? 'bg-blue-50 border-l-2 border-blue-500' : ''
              }`}
            >
              <div
                className="flex items-center space-x-2 cursor-pointer flex-1"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.icon}
                <span className="text-sm">{suggestion.text}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={`text-xs ${getSuggestionTypeColor(suggestion.type)}`}>
                  {getSuggestionTypeLabel(suggestion.type)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSuggestion(suggestion.text, suggestion.type);
                  }}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {recentSearches.length > 0 && suggestions.some(s => s.type === 'recent') && (
            <div className="border-t px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                <X className="h-3 w-3 mr-1" />
                Clear recent searches
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};