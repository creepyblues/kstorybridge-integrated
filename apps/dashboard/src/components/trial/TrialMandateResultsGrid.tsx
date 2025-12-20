/**
 * TrialMandateResultsGrid
 *
 * Results grid for trial mandate searches that links to /trial/titles/:id
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { TitleMatch } from '@/services/mandateService';
import { trackTrialResultClicked } from '@/utils/analytics';

interface TrialMandateResultsGridProps {
  results: TitleMatch[];
  isLoading?: boolean;
  mandateText?: string;
}

// Trial-specific card that opens in same tab to /trial/titles/:id
function TrialMandateTitleCard({ match, enableTypewriter = false, position }: { match: TitleMatch; enableTypewriter?: boolean; position: number }) {
  const navigate = useNavigate();
  const [typewriterDone, setTypewriterDone] = useState(!enableTypewriter);

  const handleCardClick = () => {
    // Track result click
    trackTrialResultClicked(
      'mandates',
      match.title_id,
      match.title_name_en || match.title_name_kr,
      match.match_score,
      position
    );
    // Navigate to trial title detail using React Router for smooth transition
    navigate(`/trial/titles/${match.title_id}?source=mandates`);
  };

  const getMatchScoreBadge = (score: number) => {
    if (score >= 85) {
      return {
        gradient: 'bg-gradient-to-r from-emerald-100 to-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
      };
    }
    if (score >= 70) {
      return {
        gradient: 'bg-gradient-to-r from-blue-100 to-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
      };
    }
    return {
      gradient: 'bg-gradient-to-r from-purple-100 to-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
    };
  };

  // Fallback explanation when server AI explanation is not available
  const getFallbackExplanation = () => {
    const format = match.content_format || 'title';
    const mainGenre = match.genre?.[0] || 'story';
    const toneDesc = match.tone ? ` with ${match.tone} tone` : '';
    return `This ${format} may align with your mandate based on its ${mainGenre} elements${toneDesc}. Review the synopsis for detailed story information.`;
  };

  const matchBadge = getMatchScoreBadge(match.match_score);
  const aiExplanation = match.ai_explanation || getFallbackExplanation();
  const matchHighlights = match.match_highlights || [];

  return (
    <Card
      className="bg-white border border-gray-300 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
          {match.title_image ? (
            <img
              src={match.title_image}
              alt={match.title_name_en || match.title_name_kr}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x600?text=No+Image';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          <div
            className={`absolute top-3 right-3 ${matchBadge.gradient} ${matchBadge.text} ${matchBadge.border} border px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm`}
          >
            {match.match_score}%
          </div>
        </div>

        <div className="p-4 md:p-6 flex flex-col">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-hanok-teal transition-colors">
            {match.title_name_en || match.title_name_kr}
          </h3>
          {match.title_name_en && match.title_name_kr && (
            <p className="text-sm text-gray-500 mb-3">{match.title_name_kr}</p>
          )}

          <div className="w-full h-px bg-gray-300 mb-3"></div>

          <div className="flex flex-wrap gap-2 mb-3">
            {match.genre.slice(0, 3).map((g, idx) => (
              <span
                key={idx}
                className="bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 px-2 py-1 rounded-md text-xs font-medium border border-cyan-200"
              >
                {g}
              </span>
            ))}
            {match.tone && (
              <span className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-2 py-1 rounded-md text-xs font-medium border border-purple-200">
                {match.tone}
              </span>
            )}
            {match.content_format && (
              <span className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-2 py-1 rounded-md text-xs font-medium border border-blue-200">
                {match.content_format}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3">
            {match.synopsis}
          </p>

          {(match.story_author || match.art_author) && (
            <div className="text-xs text-gray-500 mb-4">
              {match.story_author && <div>Story: {match.story_author}</div>}
              {match.art_author && match.art_author !== match.story_author && (
                <div>Art: {match.art_author}</div>
              )}
            </div>
          )}

          <div className="flex gap-3 bg-hanok-teal/5 rounded-xl p-3 border border-hanok-teal/20">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-hanok-teal flex items-center justify-center">
                <Icon icon="solar:chat-round-dots-bold-duotone" className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-hanok-teal mb-1">AI Analysis</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {enableTypewriter && !typewriterDone ? (
                  <TypewriterText
                    text={aiExplanation}
                    speed={20}
                    onComplete={() => setTypewriterDone(true)}
                  />
                ) : (
                  aiExplanation
                )}
              </p>
              {matchHighlights.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {matchHighlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <Icon icon="solar:check-circle-bold" className="w-3 h-3 text-hanok-teal mt-0.5 flex-shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrialMandateResultsGrid({
  results,
  isLoading = false,
  mandateText,
}: TrialMandateResultsGridProps) {
  // Track whether these results are "new" (just loaded) for typewriter effect
  const prevResultsRef = useRef<string[]>([]);
  const [isNewResults, setIsNewResults] = useState(false);

  useEffect(() => {
    const currentIds = results.map(r => r.title_id);
    const prevIds = prevResultsRef.current;

    // Results are "new" if they're different from previous results
    const hasNewResults = results.length > 0 && (
      currentIds.length !== prevIds.length ||
      currentIds.some((id, idx) => id !== prevIds[idx])
    );

    if (hasNewResults) {
      setIsNewResults(true);
      // Reset after all typewriters should be done (generous timeout)
      const timer = setTimeout(() => setIsNewResults(false), 10000);
      prevResultsRef.current = currentIds;
      return () => clearTimeout(timer);
    }
  }, [results]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Icon icon="solar:refresh-circle-bold-duotone" className="h-12 w-12 text-hanok-teal animate-spin mb-4" />
        <p className="text-gray-600 text-sm">Finding titles that match your mandate...</p>
        <p className="text-gray-500 text-xs mt-2">This may take a few seconds</p>
      </div>
    );
  }

  if (!mandateText && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon icon="solar:magnifer-bold-duotone" className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ready to Find Your Perfect Titles
        </h3>
        <p className="text-gray-600 text-sm text-center max-w-md">
          Describe your mandate above to get AI-powered title recommendations.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon icon="solar:magnifer-bold-duotone" className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Matches Found
        </h3>
        <p className="text-gray-600 text-sm text-center max-w-md">
          Try adjusting your criteria or being more general.
        </p>
      </div>
    );
  }

  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.match_score, 0) / results.length
  );

  return (
    <div className="space-y-6">
      {mandateText && (
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-700">You</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Your Mandate
              </p>
              <p className="text-base text-gray-800 leading-relaxed">
                {mandateText}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Found {results.length} {results.length === 1 ? 'Match' : 'Matches'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Average match score: <span className="font-semibold">{avgScore}%</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((match, index) => (
          <TrialMandateTitleCard
            key={match.title_id}
            match={match}
            enableTypewriter={isNewResults}
            position={index + 1}
          />
        ))}
      </div>

      <div className="text-center py-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Click on any title to view detailed information
        </p>
      </div>
    </div>
  );
}
