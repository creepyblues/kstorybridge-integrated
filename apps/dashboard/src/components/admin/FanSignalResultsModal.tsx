/**
 * Fan Signal Results Modal
 *
 * Displays fan engagement data collected from Reddit, AO3, and Comick
 * with specialized layouts for each source type.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  Heart,
  Users,
  BookOpen,
  Star,
  TrendingUp,
  Hash,
} from 'lucide-react';
import {
  type FanSignalData,
  type RedditData,
  type AO3Data,
  type ComickData,
  formatNumber,
} from '@/services/intelligenceService';

interface FanSignalResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: FanSignalData | null;
}

export function FanSignalResultsModal({
  open,
  onOpenChange,
  results,
}: FanSignalResultsModalProps) {
  const [openSections, setOpenSections] = useState<string[]>(['reddit', 'ao3', 'comick']);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const hasAnyData = results && (results.reddit || results.ao3 || results.comick);
  const hasErrors = results && Object.keys(results.errors).length > 0;

  // Build summary stats
  const getSummary = () => {
    if (!results) return '';
    const parts: string[] = [];
    if (results.reddit) {
      parts.push(`Reddit: ${results.reddit.posts} posts`);
    }
    if (results.ao3) {
      parts.push(`AO3: ${results.ao3.works} works`);
    }
    if (results.comick) {
      parts.push(`Comick: ${formatNumber(results.comick.followers)} followers`);
    }
    return parts.join(' | ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#4C9C9B]" />
            Fan Signal Results
            {results && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                for "{results.titleName}"
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {!results ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>No results available</p>
          </div>
        ) : !hasAnyData ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>No fan engagement data found</p>
            {hasErrors && (
              <div className="mt-4 text-sm">
                <p className="font-medium text-red-600">Errors:</p>
                {Object.entries(results.errors).map(([source, error]) => (
                  <p key={source} className="text-red-500">
                    {source}: {error}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reddit Section */}
            {results.reddit && (
              <RedditSection
                data={results.reddit}
                isOpen={openSections.includes('reddit')}
                onToggle={() => toggleSection('reddit')}
              />
            )}

            {/* AO3 Section */}
            {results.ao3 && (
              <AO3Section
                data={results.ao3}
                isOpen={openSections.includes('ao3')}
                onToggle={() => toggleSection('ao3')}
              />
            )}

            {/* Comick Section */}
            {results.comick && (
              <ComickSection
                data={results.comick}
                isOpen={openSections.includes('comick')}
                onToggle={() => toggleSection('comick')}
              />
            )}

            {/* Errors Section */}
            {hasErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-700 mb-1">Collection Errors:</p>
                {Object.entries(results.errors).map(([source, error]) => (
                  <p key={source} className="text-sm text-red-600">
                    {source}: {error}
                  </p>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              {getSummary()}
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Reddit Section
// ============================================================================

interface RedditSectionProps {
  data: RedditData;
  isOpen: boolean;
  onToggle: () => void;
}

function RedditSection({ data, isOpen, onToggle }: RedditSectionProps) {
  return (
    <Collapsible open={isOpen} className="border rounded-lg overflow-hidden">
      <CollapsibleTrigger
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 bg-orange-50 hover:bg-orange-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">r/</span>
          </div>
          <span className="font-semibold">Reddit</span>
          <Badge variant="secondary" className="text-xs">
            {data.posts} posts
          </Badge>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Posts" value={data.posts} />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total Upvotes" value={formatNumber(data.total_upvotes)} />
            <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Total Comments" value={formatNumber(data.total_comments)} />
            <StatCard icon={<Users className="h-4 w-4" />} label="Subreddit Subs" value={formatNumber(data.related_subreddit_subscribers)} />
          </div>

          {/* Engagement Score */}
          {data.engagement_score !== null && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600">Engagement Score:</span>
              <Badge className="bg-yellow-100 text-yellow-800">{data.engagement_score.toFixed(1)}</Badge>
            </div>
          )}

          {/* Top Posts */}
          {data.top_posts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Top Posts</h4>
              <div className="space-y-2">
                {data.top_posts.slice(0, 5).map((post, idx) => (
                  <div key={idx} className="bg-gray-50 rounded p-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline line-clamp-2 flex-1"
                      >
                        {post.title}
                      </a>
                      <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>r/{post.subreddit}</span>
                      <span>{post.score} upvotes</span>
                      <span>{post.comments} comments</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subreddits */}
          {data.subreddits.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Related Subreddits</h4>
              <div className="flex flex-wrap gap-2">
                {data.subreddits.slice(0, 5).map((sub, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    r/{sub.name} ({formatNumber(sub.subscribers)} subs)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// AO3 Section
// ============================================================================

interface AO3SectionProps {
  data: AO3Data;
  isOpen: boolean;
  onToggle: () => void;
}

function AO3Section({ data, isOpen, onToggle }: AO3SectionProps) {
  return (
    <Collapsible open={isOpen} className="border rounded-lg overflow-hidden">
      <CollapsibleTrigger
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 bg-red-50 hover:bg-red-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
            <BookOpen className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold">Archive of Our Own</span>
          <Badge variant="secondary" className="text-xs">
            {data.works} works
          </Badge>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<BookOpen className="h-4 w-4" />} label="Works" value={data.works} />
            <StatCard icon={<Heart className="h-4 w-4" />} label="Total Kudos" value={formatNumber(data.total_kudos)} />
            <StatCard icon={<BookOpen className="h-4 w-4" />} label="Bookmarks" value={formatNumber(data.total_bookmarks)} />
            <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Comments" value={formatNumber(data.total_comments)} />
          </div>

          {/* Top Works */}
          {data.top_works.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Top Works by Kudos</h4>
              <div className="space-y-2">
                {data.top_works.slice(0, 5).map((work, idx) => (
                  <div key={idx} className="bg-gray-50 rounded p-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={work.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline line-clamp-2 flex-1"
                      >
                        {work.title}
                      </a>
                      <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>by {work.authors.join(', ') || 'Anonymous'}</span>
                      <span>{work.kudos} kudos</span>
                      <span>{work.bookmarks} bookmarks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Tags */}
          {data.popular_relationships.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Popular Relationships</h4>
              <div className="flex flex-wrap gap-2">
                {data.popular_relationships.slice(0, 5).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag.tag} ({tag.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.popular_characters.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Popular Characters</h4>
              <div className="flex flex-wrap gap-2">
                {data.popular_characters.slice(0, 5).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag.tag} ({tag.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// Comick Section
// ============================================================================

interface ComickSectionProps {
  data: ComickData;
  isOpen: boolean;
  onToggle: () => void;
}

function ComickSection({ data, isOpen, onToggle }: ComickSectionProps) {
  return (
    <Collapsible open={isOpen} className="border rounded-lg overflow-hidden">
      <CollapsibleTrigger
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 bg-purple-50 hover:bg-purple-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
            <BookOpen className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold">Comick</span>
          {data.followers !== null && (
            <Badge variant="secondary" className="text-xs">
              {formatNumber(data.followers)} followers
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 space-y-4">
          {/* Title Info */}
          <div className="flex gap-4">
            {data.thumbnail && (
              <div className="flex-shrink-0">
                <img
                  src={data.thumbnail}
                  alt={data.title || 'Cover'}
                  className="w-20 h-28 object-cover rounded shadow"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              {data.title && (
                <h4 className="font-medium">{data.title}</h4>
              )}
              {data.author && (
                <p className="text-sm text-gray-600">by {data.author}</p>
              )}
              {data.synopsis && (
                <p className="text-sm text-gray-500 line-clamp-3">{data.synopsis}</p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Users className="h-4 w-4" />} label="Followers" value={formatNumber(data.followers)} />
            <StatCard icon={<Star className="h-4 w-4" />} label="Rating" value={data.rating?.toFixed(1) || '-'} />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Ranking" value={data.ranking ? `#${data.ranking}` : '-'} />
            <StatCard icon={<BookOpen className="h-4 w-4" />} label="Chapters" value={data.chapter_count || '-'} />
          </div>

          {/* Status */}
          <div className="flex flex-wrap gap-2">
            {data.status && (
              <Badge variant={data.status === 'completed' ? 'default' : 'secondary'}>
                {data.status}
              </Badge>
            )}
            {data.origin && (
              <Badge variant="outline">{data.origin}</Badge>
            )}
            {data.content_rating && (
              <Badge variant="outline">{data.content_rating}</Badge>
            )}
          </div>

          {/* Genres & Themes */}
          {data.genres.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Genres</h4>
              <div className="flex flex-wrap gap-2">
                {data.genres.map((genre, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    <Hash className="h-3 w-3 mr-1" />
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.themes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Themes</h4>
              <div className="flex flex-wrap gap-2">
                {data.themes.map((theme, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Platform Link */}
          {data.platform_url && (
            <a
              href={data.platform_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              View on Comick
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-lg font-semibold text-gray-900">
        {value ?? '-'}
      </div>
    </div>
  );
}
