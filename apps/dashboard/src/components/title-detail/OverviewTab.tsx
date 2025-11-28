import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TierGatedContent } from '@/components/tier/TierGatedContent';
import { Title } from '@/services/titlesService';
import {
  Briefcase,
  Target,
  Film,
  Trophy,
  Newspaper,
  Package,
  Star,
} from 'lucide-react';

interface OverviewTabProps {
  title: Title;
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

export function OverviewTab({ title }: OverviewTabProps) {
  const hasRightsAvailable = title.rights_available && title.rights_available.length > 0;
  const hasComps = title.comps && title.comps.length > 0;
  const hasAwards = title.awards && title.awards.length > 0;
  const hasAchievements = hasAwards || title.media_coverage || title.merchandise_deals || title.print_editions || title.celebrity_endorsements || title.sales_records;
  const hasKeywords = title.keywords && title.keywords.length > 0;

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
    </div>
  );
}
