import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { omdbService, OMDBSearchResult } from '@/services/omdbService';
import { useOMDBAutocomplete } from '@/hooks/useOMDBAutocomplete';
import { trackHomeCtaClicked, trackHomeSearchInitiated, trackExternalLinkClicked } from '@/utils/analytics';
import { HERO_SAMPLES } from '@/data/examplesData';

// Use centralized sample data from examplesData.ts
const SAMPLE_SHOW = HERO_SAMPLES.showComp.sampleTitle;
const SAMPLE_BRIEF = HERO_SAMPLES.brief.sampleText;

export function HeroSection() {
  const navigate = useNavigate();
  const [showInput, setShowInput] = useState('');
  const [briefInput, setBriefInput] = useState('');

  // Use shared OMDB autocomplete hook
  const {
    suggestions,
    isLoading,
    showDropdown,
    setShowDropdown,
    dropdownRef,
    focusedIndex,
    handleKeyDown,
  } = useOMDBAutocomplete(showInput, { maxResults: 5 });

  const handleSelectSuggestion = (result: OMDBSearchResult) => {
    // Track search initiated with autocomplete selection
    trackHomeSearchInitiated('show_comp', result.Title, 'autocomplete');
    setShowDropdown(false);

    // Navigate to comps-navigator with the selected show
    navigate(`/buyers/comps-navigator?show=${encodeURIComponent(result.Title)}`);
  };

  const handleShowCompSubmit = () => {
    if (showInput.trim()) {
      // Track search initiated via manual input
      trackHomeSearchInitiated('show_comp', showInput.trim(), 'manual');

      navigate(`/buyers/comps-navigator?show=${encodeURIComponent(showInput.trim())}`);
    }
  };

  const handleBriefSubmit = () => {
    if (briefInput.trim()) {
      // Track brief search initiated
      trackHomeSearchInitiated('brief', briefInput.trim(), 'manual');

      navigate(`/buyers/mandates?brief=${encodeURIComponent(briefInput.trim())}`);
    }
  };

  const handleSampleShowClick = () => {
    // Track sample CTA click
    trackHomeCtaClicked('show_comp_sample', SAMPLE_SHOW);

    navigate(`/buyers/comps-navigator?show=${encodeURIComponent(SAMPLE_SHOW)}`);
  };

  const handleSampleBriefClick = () => {
    // Track sample CTA click
    trackHomeCtaClicked('brief_sample', SAMPLE_BRIEF);

    navigate(`/buyers/mandates?brief=${encodeURIComponent(SAMPLE_BRIEF)}`);
  };

  const handleHotNowClick = () => {
    // Track hot now CTA click
    trackHomeCtaClicked('hot_now', 'featured');

    navigate('/buyers/featured');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: I have a show I like */}
      <Card className="bg-white border-2 border-hanok-teal rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardContent className="p-6">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-hanok-teal/10 flex items-center justify-center mb-5">
            <div className="relative">
              <Icon icon="solar:clapperboard-bold-duotone" className="h-7 w-7 text-hanok-teal" />
              <Icon icon="solar:magnifer-bold-duotone" className="h-4 w-4 text-hanok-teal absolute -bottom-1 -right-1" />
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
                  handleKeyDown(e, handleSelectSuggestion);
                  // If no dropdown or Enter not handled by hook, submit form
                  if (e.key === 'Enter' && !showDropdown) {
                    handleShowCompSubmit();
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="Try 'Twilight' or 'Bridgerton'"
                className="border-gray-300 focus:border-hanok-teal focus:ring-hanok-teal pr-8"
                aria-label="Search for a show"
                aria-autocomplete="list"
                aria-expanded={showDropdown}
                aria-controls="show-suggestions"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 animate-spin text-gray-400" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Suggestions Dropdown with Poster Images */}
            {showDropdown && suggestions.length > 0 && (
              <div
                id="show-suggestions"
                role="listbox"
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto"
              >
                {suggestions.map((result, index) => (
                  <div
                    key={result.imdbID}
                    role="option"
                    aria-selected={focusedIndex === index}
                    onClick={() => handleSelectSuggestion(result)}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors group ${
                      focusedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Poster Image */}
                    <div className="w-10 h-14 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                      {result.Poster && result.Poster !== 'N/A' ? (
                        <img
                          src={result.Poster}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.classList.remove('hidden');
                            }
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${result.Poster && result.Poster !== 'N/A' ? 'hidden' : ''}`}>
                        {result.Type === 'series' ? (
                          <Icon icon="solar:tv-bold-duotone" className="h-5 w-5 text-gray-300" aria-hidden="true" />
                        ) : (
                          <Icon icon="solar:clapperboard-bold-duotone" className="h-5 w-5 text-gray-300" aria-hidden="true" />
                        )}
                      </div>
                    </div>

                    {/* Title Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {result.Type === 'series' ? (
                          <Icon icon="solar:tv-bold-duotone" className="h-4 w-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
                        ) : (
                          <Icon icon="solar:clapperboard-bold-duotone" className="h-4 w-4 text-purple-500 flex-shrink-0" aria-hidden="true" />
                        )}
                        <span className="font-medium text-gray-900 truncate text-sm">{result.Title}</span>
                      </div>
                      <span className="text-gray-500 text-xs">({result.Year})</span>
                    </div>

                    {/* IMDB Link - Fixed: Changed from yellow to blue per design system */}
                    <a
                      href={omdbService.getIMDBUrl(result.imdbID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        trackExternalLinkClicked(omdbService.getIMDBUrl(result.imdbID), 'imdb', result.Title);
                      }}
                      className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                      title="View on IMDB"
                      aria-label={`View ${result.Title} on IMDB`}
                    >
                      <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Button */}
          <Button
            onClick={handleShowCompSubmit}
            disabled={!showInput.trim()}
            className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white font-medium disabled:opacity-50"
          >
            FIND SIMILAR IP
            <Icon icon="solar:arrow-right-bold-duotone" className="h-4 w-4 ml-2" aria-hidden="true" />
          </Button>

          {/* Sample Link */}
          <div className="mt-3 text-center">
            <button
              onClick={handleSampleShowClick}
              className="text-xs text-gray-500 hover:text-hanok-teal transition-colors underline underline-offset-2"
            >
              Try: {SAMPLE_SHOW}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: I have a brief */}
      <Card className="bg-white border-2 border-purple-500 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardContent className="p-6">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-5">
            <Icon icon="solar:document-text-bold-duotone" className="h-7 w-7 text-purple-500" />
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleBriefSubmit();
              }
            }}
            placeholder="e.g., 'Female-driven thriller'"
            className="mb-4 border-gray-300 focus:border-purple-500 focus:ring-purple-500 min-h-[42px] resize-none"
            rows={1}
            aria-label="Describe what you're looking for"
          />

          {/* Button */}
          <Button
            onClick={handleBriefSubmit}
            disabled={!briefInput.trim()}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium disabled:opacity-50"
          >
            SEARCH BY BRIEF
            <Icon icon="solar:arrow-right-bold-duotone" className="h-4 w-4 ml-2" aria-hidden="true" />
          </Button>

          {/* Sample Link */}
          <div className="mt-3 text-center">
            <button
              onClick={handleSampleBriefClick}
              className="text-xs text-gray-500 hover:text-purple-500 transition-colors underline underline-offset-2"
            >
              Try: {SAMPLE_BRIEF}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: What's hot now */}
      <Card className="bg-white border-2 border-orange-500 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardContent className="p-6">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-5">
            <Icon icon="solar:graph-up-bold-duotone" className="h-7 w-7 text-orange-500" />
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
            onClick={handleHotNowClick}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium"
          >
            VIEW TRENDING
            <Icon icon="solar:arrow-right-bold-duotone" className="h-4 w-4 ml-2" aria-hidden="true" />
          </Button>

          {/* Sample Link - go to same page */}
          <div className="mt-3 text-center">
            <button
              onClick={handleHotNowClick}
              className="text-xs text-gray-500 hover:text-orange-500 transition-colors underline underline-offset-2"
            >
              Browse featured titles
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
