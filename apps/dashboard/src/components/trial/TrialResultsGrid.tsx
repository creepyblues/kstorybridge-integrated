/**
 * TrialResultsGrid
 *
 * Results grid for trial mode that links to /trial/titles/:id.
 * Note: Loading state is now handled by SearchLoadingModal at the page level.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { TitleMatch, getMatchScore } from '@/services/compsNavigatorService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trackTrialResultClicked } from '@/utils/analytics';

interface TrialResultsGridProps {
  results: TitleMatch[];
}

// Trial-specific card
function TrialTitleMatchCard({ match, enableTypewriter = false, position }: { match: TitleMatch; enableTypewriter?: boolean; position: number }) {
  const [showModal, setShowModal] = useState(false);
  const [typewriterDone, setTypewriterDone] = useState(!enableTypewriter);

  const getMatchScoreBadge = (score: number) => {
    if (score >= 85) {
      return {
        gradient: 'bg-gradient-to-r from-emerald-100 to-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200'
      };
    }
    if (score >= 70) {
      return {
        gradient: 'bg-gradient-to-r from-blue-100 to-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200'
      };
    }
    return {
      gradient: 'bg-gradient-to-r from-purple-100 to-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200'
    };
  };

  const score = getMatchScore(match);
  const matchBadge = getMatchScoreBadge(score);

  const handleCardClick = () => {
    // Track result click
    trackTrialResultClicked(
      'comps',
      match.title_id,
      match.title_name_en || match.title_name_kr,
      score,
      position
    );
    setShowModal(true);
  };

  return (
    <>
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

            <div className={`absolute top-3 right-3 ${matchBadge.gradient} ${matchBadge.text} ${matchBadge.border} border px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm`}>
              {score}%
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
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="bg-hanok-teal/10 rounded-full p-2">
                  <Icon icon="solar:chat-round-dots-bold-duotone" className="h-5 w-5 text-hanok-teal" />
                </div>
              </div>
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3">
                <p className="text-sm text-gray-700">
                  {enableTypewriter && !typewriterDone ? (
                    <TypewriterText
                      text={match.explanation}
                      speed={20}
                      onComplete={() => setTypewriterDone(true)}
                    />
                  ) : (
                    match.explanation
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <TrialMatchDetailModal
          match={match}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// Trial-specific modal that links to /trial/titles/:id
function TrialMatchDetailModal({ match, onClose }: { match: TitleMatch; onClose: () => void }) {
  const navigate = useNavigate();
  const score = getMatchScore(match);

  const handleViewFullTitle = () => {
    navigate(`/trial/titles/${match.title_id}?source=comps`);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {match.title_name_en || match.title_name_kr}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detailed match information for {match.title_name_en || match.title_name_kr}
          </DialogDescription>
          {match.title_name_en && match.title_name_kr && (
            <p className="text-gray-500">{match.title_name_kr}</p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-gray-900">
              {score}%
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Match</p>
              <p className="text-xs text-gray-500">Based on comp combination</p>
            </div>
          </div>

          <div className="flex gap-4">
            {match.title_image && (
              <img
                src={match.title_image}
                alt={match.title_name_en || match.title_name_kr}
                className="w-32 h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Genre & Tone</p>
                <div className="flex flex-wrap gap-2">
                  {match.genre.map((g, idx) => (
                    <span key={idx} className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {g}
                    </span>
                  ))}
                  {match.tone && (
                    <span className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
                      {match.tone}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Synopsis</p>
                <p className="text-sm text-gray-700 line-clamp-4">{match.synopsis}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Why This Matches</h3>
            <p className="text-sm text-gray-700">{match.explanation}</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleViewFullTitle}
              className="flex-1 flex items-center justify-center gap-2 bg-hanok-teal hover:bg-hanok-teal/90"
            >
              <span>View Full Title Details</span>
              <Icon icon="solar:square-arrow-right-up-bold-duotone" className="h-4 w-4" />
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TrialResultsGrid({ results }: TrialResultsGridProps) {
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

  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600 mb-2">No results yet</p>
        <p className="text-sm text-gray-500">Add comps and click "Find Matches" to search</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
          {results.length} {results.length === 1 ? 'Match' : 'Matches'} Found
        </h2>
        <p className="text-gray-600">
          AI-ranked Korean titles matching your comp combination
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((match, index) => (
          <TrialTitleMatchCard
            key={match.title_id}
            match={match}
            enableTypewriter={isNewResults}
            position={index + 1}
          />
        ))}
      </div>
    </div>
  );
}
