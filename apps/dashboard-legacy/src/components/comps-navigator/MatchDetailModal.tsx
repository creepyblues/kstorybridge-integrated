/**
 * MatchDetailModal Component
 *
 * Modal showing full match details:
 * - Full explanation
 * - Individual comp alignments with scores and reasons
 * - Link to full title detail page
 */

import { X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TitleMatch } from '@/services/compsNavigatorService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button
} from '@kstorybridge/ui';

interface MatchDetailModalProps {
  match: TitleMatch;
  onClose: () => void;
}

export default function MatchDetailModal({ match, onClose }: MatchDetailModalProps) {
  const navigate = useNavigate();

  const handleViewFullTitle = () => {
    navigate(`/buyers/titles/${match.title_id}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {match.title_name_en || match.title_name_kr}
          </DialogTitle>
          {match.title_name_en && match.title_name_kr && (
            <p className="text-gray-500">{match.title_name_kr}</p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Match Score */}
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-gray-900">
              {match.match_score}%
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Match</p>
              <p className="text-xs text-gray-500">Based on comp combination</p>
            </div>
          </div>

          {/* Title Image and Basic Info */}
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
              {/* Genre and Tone */}
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

              {/* Synopsis */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Synopsis</p>
                <p className="text-sm text-gray-700 line-clamp-4">{match.synopsis}</p>
              </div>
            </div>
          </div>

          {/* Match Explanation */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Why This Matches</h3>
            <p className="text-sm text-gray-700">{match.explanation}</p>
          </div>

          {/* Individual Comp Alignments */}
          {match.comp_alignments && match.comp_alignments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Comp Alignment Breakdown</h3>
              <div className="space-y-4">
                {match.comp_alignments.map((alignment, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{alignment.comp_title}</h4>
                      <span className={`text-2xl font-bold ${getScoreColor(alignment.alignment_score)}`}>
                        {alignment.alignment_score}%
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {alignment.reasons.map((reason, ridx) => (
                        <li key={ridx} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleViewFullTitle}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <span>View Full Title Details</span>
              <ExternalLink className="h-4 w-4" />
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
