import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TierGatedContent } from '@/components/tier/TierGatedContent';
import { Title } from '@/services/titlesService';
import { type PitchAnalysis } from '@/types/pitchAnalysis';
import { UserTier } from '@/contexts/TierContext';
import { AIInsightCard } from './AIInsightCard';
import PitchDeckThumbnail from '@/components/premium/PitchDeckThumbnail';
import SecurePDFViewer from '@/components/premium/SecurePDFViewer';
import {
  Briefcase,
  Target,
  Film,
  Trophy,
  Newspaper,
  Package,
  Star,
  Gem,
  Shield,
  FileText,
  X,
} from 'lucide-react';

interface OverviewTabProps {
  title: Title;
  pitchAnalysis?: PitchAnalysis | null;
  userTier: UserTier;
}

// Map rights_available values to display labels
const RIGHTS_LABELS: Record<string, string> = {
  film_tv: 'Film/TV',
  animation: 'Animation',
  publication: 'Publication',
  merchandising: 'Merchandising',
  game: 'Game',
  other: 'Other',
};

export function OverviewTab({ title, pitchAnalysis, userTier }: OverviewTabProps) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const hasRightsAvailable = title.rights_available && title.rights_available.length > 0;
  const hasComps = title.comps && title.comps.length > 0;
  const hasAwards = title.awards && title.awards.length > 0;
  const hasAchievements = hasAwards || title.media_coverage || title.merchandise_deals || title.print_editions || title.celebrity_endorsements || title.sales_records;
  const hasKeywords = title.keywords && title.keywords.length > 0;
  const hasPitchDeck = title.pitch && title.pitch.trim() !== '';

  // AI Pitch Analysis availability checks
  const hasAITargetAudience = pitchAnalysis?.market_positioning?.target_audience;
  const hasAIComparables = pitchAnalysis?.market_positioning?.comparable_titles && pitchAnalysis.market_positioning.comparable_titles.length > 0;
  const hasAIPlatformFit = pitchAnalysis?.market_positioning?.platform_fit && pitchAnalysis.market_positioning.platform_fit.length > 0;
  const hasAIIPValue = pitchAnalysis?.ip_value && (
    pitchAnalysis.ip_value.franchise_potential ||
    pitchAnalysis.ip_value.unique_selling_points?.length ||
    pitchAnalysis.ip_value.cross_media_potential?.length
  );
  const hasAIContentClassification = pitchAnalysis?.content_classification && (
    pitchAnalysis.content_classification.maturity_rating ||
    pitchAnalysis.content_classification.content_warnings?.length
  );

  return (
    <div className="space-y-6">
      {/* Licensing Opportunity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rights Available Card */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Rights Available</h3>
            </div>

            {hasRightsAvailable ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {title.rights_available!.map((right, idx) => (
                  <Badge
                    key={idx}
                    className="bg-[#4C9C9B]/10 text-[#4C9C9B] border border-[#4C9C9B]/20 px-3 py-1.5 font-medium"
                  >
                    {RIGHTS_LABELS[right] || right}
                  </Badge>
                ))}
              </div>
            ) : title.rights ? (
              <p className="text-gray-600 mb-4">{title.rights}</p>
            ) : (
              <p className="text-gray-400 italic mb-4">Contact for availability</p>
            )}

            {/* Rights Holder Info */}
            <div className="pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Rights Holder</div>
              <div className="font-semibold text-black">
                {title.rights_holder_company || title.rights_holder_name || 'Contact for details'}
              </div>
              {title.rights_holder_name && title.rights_holder_company && (
                <div className="text-sm text-gray-600">{title.rights_holder_name}</div>
              )}
              <Button
                className="mt-3 bg-[#AF52DE] hover:bg-[#AF52DE]/90 text-white text-sm font-medium px-4 py-2"
                size="sm"
              >
                Contact for Licensing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Target Market Card */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Target Market</h3>
            </div>

            <TierGatedContent requiredTier="basic">
              <div className="space-y-4">
                {title.perfect_for && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Perfect For</div>
                    <div className="font-medium text-black">{title.perfect_for}</div>
                  </div>
                )}

                {title.audience && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Target Audience</div>
                    <div className="font-medium text-black">{title.audience}</div>
                  </div>
                )}

                {title.tone && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Tone</div>
                    <div className="font-medium text-black">{title.tone}</div>
                  </div>
                )}

                {!title.perfect_for && !title.audience && !title.tone && (
                  <p className="text-gray-400 italic">No target market data available</p>
                )}
              </div>
            </TierGatedContent>
          </CardContent>
        </Card>
      </div>

      {/* Pitch Deck Card */}
      {hasPitchDeck && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Pitch Deck</h3>
            </div>
            <PitchDeckThumbnail
              pdfUrl={title.pitch!}
              onClick={() => setIsPdfModalOpen(true)}
              alt={`${title.title_name_en || title.title_name_kr} pitch deck preview`}
            />
          </CardContent>
        </Card>
      )}

      {/* Comparables Card */}
      {hasComps && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Comparable Titles</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {title.comps!.map((comp, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 font-medium"
                >
                  {comp}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Synopsis Card */}
      {title.synopsis && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold text-black mb-4">Synopsis</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {title.synopsis}
            </p>

            {/* Korean tagline if different */}
            {title.tagline_kr && title.tagline_kr !== title.tagline && (
              <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-300 rounded-r-lg">
                <p className="text-gray-600 font-medium italic">"{title.tagline_kr}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Achievements & Recognition */}
      {hasAchievements && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Recognition & Achievements</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Awards */}
              {hasAwards && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-gray-700">Awards</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {title.awards!.map((award, idx) => (
                      <Badge key={idx} className="bg-amber-50 text-amber-700 border border-amber-200">
                        {award}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Coverage */}
              {title.media_coverage && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-700">Media Coverage</span>
                  </div>
                  <p className="text-gray-600 text-sm">{title.media_coverage}</p>
                </div>
              )}

              {/* Sales Records */}
              {title.sales_records && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-700">Sales Records</span>
                  </div>
                  <p className="text-gray-600 text-sm">{title.sales_records}</p>
                </div>
              )}

              {/* Merchandise & Print */}
              {(title.merchandise_deals || title.print_editions) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-gray-700">Merchandise & Print</span>
                  </div>
                  <div className="text-gray-600 text-sm space-y-1">
                    {title.print_editions && (
                      <p>Print editions available{title.print_edition_details ? `: ${title.print_edition_details}` : ''}</p>
                    )}
                    {title.merchandise_deals && <p>{title.merchandise_deals}</p>}
                  </div>
                </div>
              )}

              {/* Celebrity Endorsements */}
              {title.celebrity_endorsements && (
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-pink-500" />
                    <span className="font-medium text-gray-700">Celebrity Endorsements</span>
                  </div>
                  <p className="text-gray-600 text-sm italic">"{title.celebrity_endorsements}"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keywords */}
      {hasKeywords && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold text-black mb-4">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {title.keywords!.map((keyword, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-gray-100 text-gray-600 border border-gray-200 font-medium px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insight Cards Section */}
      {(hasAITargetAudience || hasAIComparables || hasAIPlatformFit || hasAIIPValue || hasAIContentClassification) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Target Audience Card */}
          {hasAITargetAudience && (
            <AIInsightCard
              title="Target Audience"
              icon={<Target className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <div className="space-y-3 text-gray-700">
                {pitchAnalysis!.market_positioning.target_audience.age_range && (
                  <div>
                    <span className="font-semibold">Age Range:</span> {pitchAnalysis!.market_positioning.target_audience.age_range}
                  </div>
                )}
                {pitchAnalysis!.market_positioning.target_audience.gender_skew && (
                  <div>
                    <span className="font-semibold">Gender Skew:</span> {pitchAnalysis!.market_positioning.target_audience.gender_skew}
                  </div>
                )}
                {pitchAnalysis!.market_positioning.target_audience.psychographics && (
                  <div>
                    <span className="font-semibold">Psychographics:</span> {pitchAnalysis!.market_positioning.target_audience.psychographics}
                  </div>
                )}
                {hasAIPlatformFit && (
                  <div>
                    <span className="font-semibold">Platform Fit:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pitchAnalysis!.market_positioning.platform_fit.map((platform, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AIInsightCard>
          )}

          {/* AI Comparable Titles Card */}
          {hasAIComparables && (
            <AIInsightCard
              title="Comparable Titles"
              icon={<Film className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <div className="space-y-2">
                {pitchAnalysis!.market_positioning.comparable_titles.map((comp, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-black">{comp.title}</div>
                    <div className="text-sm text-gray-600">
                      {comp.platform && <span className="mr-2">Platform: {comp.platform}</span>}
                    </div>
                    {comp.similarity && (
                      <div className="text-sm text-gray-500 mt-1">{comp.similarity}</div>
                    )}
                  </div>
                ))}
              </div>
            </AIInsightCard>
          )}

          {/* AI IP Value Card */}
          {hasAIIPValue && (
            <AIInsightCard
              title="IP Value"
              icon={<Gem className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <div className="space-y-3 text-gray-700">
                {pitchAnalysis!.ip_value.franchise_potential && (
                  <div>
                    <span className="font-semibold">Franchise Potential:</span>{' '}
                    <Badge
                      className={
                        pitchAnalysis!.ip_value.franchise_potential === 'high'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : pitchAnalysis!.ip_value.franchise_potential === 'medium'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }
                    >
                      {pitchAnalysis!.ip_value.franchise_potential.toUpperCase()}
                    </Badge>
                  </div>
                )}
                {pitchAnalysis!.ip_value.unique_selling_points && pitchAnalysis!.ip_value.unique_selling_points.length > 0 && (
                  <div>
                    <span className="font-semibold">Unique Selling Points:</span>
                    <ul className="list-disc ml-5 mt-1 text-sm">
                      {pitchAnalysis!.ip_value.unique_selling_points.map((usp, idx) => (
                        <li key={idx}>{usp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {pitchAnalysis!.ip_value.cross_media_potential && pitchAnalysis!.ip_value.cross_media_potential.length > 0 && (
                  <div>
                    <span className="font-semibold">Cross-Media Potential:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pitchAnalysis!.ip_value.cross_media_potential.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AIInsightCard>
          )}

          {/* AI Content Classification Card */}
          {hasAIContentClassification && (
            <AIInsightCard
              title="Content Rating"
              icon={<Shield className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <div className="space-y-3 text-gray-700">
                {pitchAnalysis!.content_classification.maturity_rating && (
                  <div>
                    <span className="font-semibold">Maturity Rating:</span>{' '}
                    <Badge
                      className={
                        pitchAnalysis!.content_classification.maturity_rating === 'all ages'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : pitchAnalysis!.content_classification.maturity_rating === 'teen (13+)'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }
                    >
                      {pitchAnalysis!.content_classification.maturity_rating}
                    </Badge>
                  </div>
                )}
                {pitchAnalysis!.content_classification.content_warnings && pitchAnalysis!.content_classification.content_warnings.length > 0 && (
                  <div>
                    <span className="font-semibold">Content Warnings:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pitchAnalysis!.content_classification.content_warnings.map((warning, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-amber-300 text-amber-700">
                          {warning}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {pitchAnalysis!.content_classification.complexity_score !== undefined && (
                  <div>
                    <span className="font-semibold">Complexity Score:</span> {pitchAnalysis!.content_classification.complexity_score}/10
                  </div>
                )}
              </div>
            </AIInsightCard>
          )}
        </div>
      )}

      {/* PDF Modal */}
      {isPdfModalOpen && hasPitchDeck && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-xl overflow-hidden relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPdfModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="h-full">
              <SecurePDFViewer
                pdfUrl={title.pitch!}
                userTier={userTier}
                maxPagesForBasic={5}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
