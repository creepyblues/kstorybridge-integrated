import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Title } from '@/services/titlesService';
import { type PitchAnalysis } from '@/types/pitchAnalysis';
import { AIInsightCard } from './AIInsightCard';
import { Icon } from '@iconify/react';

interface CreditsTabProps {
  title: Title;
  pitchAnalysis?: PitchAnalysis | null;
}

export function CreditsTab({ title, pitchAnalysis }: CreditsTabProps) {
  const hasCreativeTeam =
    title.story_author ||
    title.art_author ||
    title.original_author ||
    title.writer ||
    title.illustrator;

  const hasSourceMaterial =
    title.underlying_novel_en ||
    title.underlying_novel_kr ||
    title.script_title_en ||
    title.script_title_kr ||
    title.art_title_en ||
    title.art_title_kr;

  const hasCreatorAchievements =
    title.creator_achievements &&
    (title.creator_achievements.total_titles ||
      title.creator_achievements.total_views ||
      title.creator_achievements.notable_works?.length ||
      title.creator_achievements.awards_received?.length ||
      title.creator_achievements.industry_recognition);

  // AI Pitch Analysis availability checks
  const hasAICreativeTeam = pitchAnalysis?.creative_team && (
    pitchAnalysis.creative_team.author_writer ||
    pitchAnalysis.creative_team.illustrator_artist ||
    pitchAnalysis.creative_team.credentials?.length ||
    pitchAnalysis.creative_team.studio_publisher
  );
  const hasAISourceMaterial = pitchAnalysis?.source_material && (
    pitchAnalysis.source_material.original_platform ||
    pitchAnalysis.source_material.metrics
  );
  const hasAIProductionDetails = pitchAnalysis?.production_details && (
    pitchAnalysis.production_details.format ||
    pitchAnalysis.production_details.adaptation_type
  );

  return (
    <div className="space-y-6">
      {/* Creative Team Card */}
      {hasCreativeTeam && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:users-group-rounded-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Creative Team</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Story Author */}
              {title.story_author && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Story Author</div>
                  <div className="font-semibold text-black">{title.story_author}</div>
                  {title.story_author_kr && title.story_author_kr !== title.story_author && (
                    <div className="text-sm text-gray-600">{title.story_author_kr}</div>
                  )}
                </div>
              )}

              {/* Art Author */}
              {title.art_author && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Art Author</div>
                  <div className="font-semibold text-black">{title.art_author}</div>
                  {title.art_author_kr && title.art_author_kr !== title.art_author && (
                    <div className="text-sm text-gray-600">{title.art_author_kr}</div>
                  )}
                </div>
              )}

              {/* Original Author */}
              {title.original_author && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Original Author</div>
                  <div className="font-semibold text-black">{title.original_author}</div>
                  {title.original_author_kr && title.original_author_kr !== title.original_author && (
                    <div className="text-sm text-gray-600">{title.original_author_kr}</div>
                  )}
                </div>
              )}

              {/* Writer (if different from story_author) */}
              {title.writer && title.writer !== title.story_author && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Writer</div>
                  <div className="font-semibold text-black">{title.writer}</div>
                </div>
              )}

              {/* Illustrator (if different from art_author) */}
              {title.illustrator && title.illustrator !== title.art_author && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Illustrator</div>
                  <div className="font-semibold text-black">{title.illustrator}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Material Card */}
      {hasSourceMaterial && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:book-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Source Material</h3>
            </div>

            <div className="space-y-4">
              {/* Content Format Info */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">Based On:</span>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  {title.content_format
                    ? title.content_format.charAt(0).toUpperCase() + title.content_format.slice(1)
                    : 'Original Work'}
                </Badge>
                {title.is_official_english_title !== undefined && (
                  <Badge
                    variant="outline"
                    className={
                      title.is_official_english_title
                        ? 'border-green-300 text-green-700'
                        : 'border-gray-300 text-gray-600'
                    }
                  >
                    {title.is_official_english_title ? 'Official English Title' : 'Translated Title'}
                  </Badge>
                )}
              </div>

              {/* Underlying Novel */}
              {(title.underlying_novel_en || title.underlying_novel_kr) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Icon icon="solar:document-text-bold-duotone" className="w-4 h-4" />
                    Underlying Novel
                  </div>
                  {title.underlying_novel_en && (
                    <div className="font-semibold text-black">{title.underlying_novel_en}</div>
                  )}
                  {title.underlying_novel_kr && (
                    <div className="text-sm text-gray-600">{title.underlying_novel_kr}</div>
                  )}
                </div>
              )}

              {/* Script Title */}
              {(title.script_title_en || title.script_title_kr) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Icon icon="solar:document-text-bold-duotone" className="w-4 h-4" />
                    Script Title
                  </div>
                  {title.script_title_en && (
                    <div className="font-semibold text-black">{title.script_title_en}</div>
                  )}
                  {title.script_title_kr && (
                    <div className="text-sm text-gray-600">{title.script_title_kr}</div>
                  )}
                </div>
              )}

              {/* Art Title */}
              {(title.art_title_en || title.art_title_kr) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Icon icon="solar:document-text-bold-duotone" className="w-4 h-4" />
                    Art Title
                  </div>
                  {title.art_title_en && (
                    <div className="font-semibold text-black">{title.art_title_en}</div>
                  )}
                  {title.art_title_kr && (
                    <div className="text-sm text-gray-600">{title.art_title_kr}</div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creator Achievements Card */}
      {hasCreatorAchievements && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:cup-star-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Creator Track Record</h3>
            </div>

            <div className="space-y-4">
              {/* Stats Row */}
              <div className="flex flex-wrap gap-4">
                {title.creator_achievements?.total_titles && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center min-w-[100px]">
                    <Icon icon="solar:document-text-bold-duotone" className="w-5 h-5 text-[#4C9C9B] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-black">
                      {title.creator_achievements.total_titles}
                    </div>
                    <div className="text-xs text-gray-500">Published Titles</div>
                  </div>
                )}

                {title.creator_achievements?.total_views && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center min-w-[100px]">
                    <Icon icon="solar:eye-bold-duotone" className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-black">
                      {title.creator_achievements.total_views}
                    </div>
                    <div className="text-xs text-gray-500">Total Views</div>
                  </div>
                )}
              </div>

              {/* Notable Works */}
              {title.creator_achievements?.notable_works &&
                title.creator_achievements.notable_works.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Notable Works</div>
                    <div className="flex flex-wrap gap-2">
                      {title.creator_achievements.notable_works.map((work, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700">
                          {work}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Awards Received */}
              {title.creator_achievements?.awards_received &&
                title.creator_achievements.awards_received.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Icon icon="solar:star-bold-duotone" className="w-4 h-4 text-amber-500" />
                      Awards Received
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {title.creator_achievements.awards_received.map((award, idx) => (
                        <Badge key={idx} className="bg-amber-50 text-amber-700 border border-amber-200">
                          {award}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Industry Recognition */}
              {title.creator_achievements?.industry_recognition && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Industry Recognition</div>
                  <p className="text-gray-600">{title.creator_achievements.industry_recognition}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insight Cards Section */}
      {(hasAICreativeTeam || hasAISourceMaterial || hasAIProductionDetails) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Creative Team Card */}
          {hasAICreativeTeam && (
            <AIInsightCard
              title="Creative Team"
              icon={<Icon icon="solar:users-group-rounded-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <div className="space-y-3 text-gray-700">
                {pitchAnalysis!.creative_team.author_writer && (
                  <div>
                    <span className="font-semibold">Author/Writer:</span> {pitchAnalysis!.creative_team.author_writer}
                  </div>
                )}
                {pitchAnalysis!.creative_team.illustrator_artist && (
                  <div>
                    <span className="font-semibold">Illustrator/Artist:</span> {pitchAnalysis!.creative_team.illustrator_artist}
                  </div>
                )}
                {pitchAnalysis!.creative_team.studio_publisher && (
                  <div>
                    <span className="font-semibold">Studio/Publisher:</span> {pitchAnalysis!.creative_team.studio_publisher}
                  </div>
                )}
                {pitchAnalysis!.creative_team.credentials && pitchAnalysis!.creative_team.credentials.length > 0 && (
                  <div>
                    <span className="font-semibold">Credentials:</span>
                    <ul className="list-disc ml-5 mt-1 text-sm">
                      {pitchAnalysis!.creative_team.credentials.map((cred, idx) => (
                        <li key={idx}>{cred}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AIInsightCard>
          )}

          {/* AI Source Material Card */}
          {hasAISourceMaterial && (
            <AIInsightCard
              title="Source Material"
              icon={<Icon icon="solar:document-text-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <div className="space-y-3 text-gray-700">
                {pitchAnalysis!.source_material.original_platform && (
                  <div>
                    <span className="font-semibold">Original Platform:</span> {pitchAnalysis!.source_material.original_platform}
                  </div>
                )}
                {pitchAnalysis!.source_material.serialization_status && (
                  <div>
                    <span className="font-semibold">Status:</span>{' '}
                    <Badge
                      className={
                        pitchAnalysis!.source_material.serialization_status === 'completed'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }
                    >
                      {pitchAnalysis!.source_material.serialization_status}
                    </Badge>
                  </div>
                )}
                {pitchAnalysis!.source_material.metrics && (
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {pitchAnalysis!.source_material.metrics.views && (
                      <div className="p-2 bg-gray-50 rounded text-center">
                        <div className="text-xs text-gray-500">Views</div>
                        <div className="font-medium">{pitchAnalysis!.source_material.metrics.views}</div>
                      </div>
                    )}
                    {pitchAnalysis!.source_material.metrics.chapters && (
                      <div className="p-2 bg-gray-50 rounded text-center">
                        <div className="text-xs text-gray-500">Chapters</div>
                        <div className="font-medium">{pitchAnalysis!.source_material.metrics.chapters}</div>
                      </div>
                    )}
                    {pitchAnalysis!.source_material.metrics.rating && (
                      <div className="p-2 bg-gray-50 rounded text-center">
                        <div className="text-xs text-gray-500">Rating</div>
                        <div className="font-medium">{pitchAnalysis!.source_material.metrics.rating}</div>
                      </div>
                    )}
                  </div>
                )}
                {pitchAnalysis!.source_material.awards_recognition && pitchAnalysis!.source_material.awards_recognition.length > 0 && (
                  <div>
                    <span className="font-semibold">Awards & Recognition:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pitchAnalysis!.source_material.awards_recognition.map((award, idx) => (
                        <Badge key={idx} className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          {award}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AIInsightCard>
          )}

          {/* AI Production Details Card */}
          {hasAIProductionDetails && (
            <AIInsightCard
              title="Production Details"
              icon={<Icon icon="solar:clapperboard-bold-duotone" className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <div className="space-y-3 text-gray-700">
                {pitchAnalysis!.production_details.format && (
                  <div>
                    <span className="font-semibold">Format:</span> {pitchAnalysis!.production_details.format}
                  </div>
                )}
                {pitchAnalysis!.production_details.adaptation_type && (
                  <div>
                    <span className="font-semibold">Adaptation Type:</span> {pitchAnalysis!.production_details.adaptation_type}
                  </div>
                )}
                {pitchAnalysis!.production_details.estimated_episodes && (
                  <div>
                    <span className="font-semibold">Estimated Episodes:</span> {pitchAnalysis!.production_details.estimated_episodes}
                  </div>
                )}
                {pitchAnalysis!.production_details.budget_range && (
                  <div>
                    <span className="font-semibold">Budget Range:</span> {pitchAnalysis!.production_details.budget_range}
                  </div>
                )}
                {pitchAnalysis!.production_details.timeline && (
                  <div>
                    <span className="font-semibold">Timeline:</span> {pitchAnalysis!.production_details.timeline}
                  </div>
                )}
              </div>
            </AIInsightCard>
          )}
        </div>
      )}

      {/* No credits message */}
      {!hasCreativeTeam && !hasSourceMaterial && !hasCreatorAchievements &&
       !hasAICreativeTeam && !hasAISourceMaterial && !hasAIProductionDetails && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-8 text-center">
            <Icon icon="solar:users-group-rounded-bold-duotone" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No detailed credits available for this title.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
