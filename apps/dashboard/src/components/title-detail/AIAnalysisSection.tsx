import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TierGatedContent } from '@/components/tier/TierGatedContent';
import { type PitchAnalysis } from '@/types/pitchAnalysis';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Globe,
  Users,
  Palette,
  BookOpen,
  Target,
  Gem,
  Film,
  FileText,
  Shield,
  Sparkles,
} from 'lucide-react';

interface AIAnalysisSectionProps {
  pitchAnalysis: PitchAnalysis;
  processingConfidence?: number;
}

export function AIAnalysisSection({ pitchAnalysis, processingConfidence }: AIAnalysisSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check which sections have data
  const hasStoryWorld = pitchAnalysis.story_world &&
    (pitchAnalysis.story_world.setting ||
      pitchAnalysis.story_world.time_period ||
      pitchAnalysis.story_world.world_building?.length);

  const hasCharacters = pitchAnalysis.characters && pitchAnalysis.characters.length > 0;

  const hasThemesTone = pitchAnalysis.themes_and_tone &&
    (pitchAnalysis.themes_and_tone.primary_themes?.length ||
      pitchAnalysis.themes_and_tone.emotional_tone ||
      pitchAnalysis.themes_and_tone.visual_style);

  const hasStoryElements = pitchAnalysis.story_elements &&
    (pitchAnalysis.story_elements.logline ||
      pitchAnalysis.story_elements.plot_summary ||
      pitchAnalysis.story_elements.genre_blend?.length);

  const hasMarketPositioning = pitchAnalysis.market_positioning &&
    (pitchAnalysis.market_positioning.target_audience ||
      pitchAnalysis.market_positioning.comparable_titles?.length ||
      pitchAnalysis.market_positioning.platform_fit?.length);

  const hasIPValue = pitchAnalysis.ip_value &&
    (pitchAnalysis.ip_value.franchise_potential ||
      pitchAnalysis.ip_value.cross_media_potential?.length ||
      pitchAnalysis.ip_value.unique_selling_points?.length);

  const hasProductionDetails = pitchAnalysis.production_details &&
    (pitchAnalysis.production_details.format ||
      pitchAnalysis.production_details.adaptation_type);

  const hasSourceMaterial = pitchAnalysis.source_material &&
    (pitchAnalysis.source_material.original_platform ||
      pitchAnalysis.source_material.metrics);

  const hasKoreanCultural = pitchAnalysis.korean_cultural_elements &&
    pitchAnalysis.korean_cultural_elements.length > 0;

  const hasContentClassification = pitchAnalysis.content_classification &&
    (pitchAnalysis.content_classification.maturity_rating ||
      pitchAnalysis.content_classification.content_warnings?.length);

  const hasAnyContent =
    hasStoryWorld ||
    hasCharacters ||
    hasThemesTone ||
    hasStoryElements ||
    hasMarketPositioning ||
    hasIPValue ||
    hasProductionDetails ||
    hasSourceMaterial ||
    hasKoreanCultural ||
    hasContentClassification;

  if (!hasAnyContent) {
    return null;
  }

  return (
    <TierGatedContent requiredTier="basic">
      <div className="mt-8">
        {/* Header with expand/collapse */}
        <div
          className="flex items-center justify-between cursor-pointer group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4C9C9B]/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#4C9C9B]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">KStoryBridge AI Analysis</h2>
              {processingConfidence !== undefined && (
                <span className="text-sm text-gray-500">
                  Confidence: {Math.round(processingConfidence * 100)}%
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 group-hover:text-gray-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-5 h-5 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5 mr-1" />
                Expand
              </>
            )}
          </Button>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Story World Card */}
            {hasStoryWorld && (
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-[#4C9C9B]" />
                    <h3 className="text-lg font-semibold text-black">Story World</h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    {pitchAnalysis.story_world?.setting && (
                      <div>
                        <span className="font-semibold">Setting:</span> {pitchAnalysis.story_world.setting}
                      </div>
                    )}
                    {pitchAnalysis.story_world?.time_period && (
                      <div>
                        <span className="font-semibold">Time Period:</span> {pitchAnalysis.story_world.time_period}
                      </div>
                    )}
                    {pitchAnalysis.story_world?.world_building && pitchAnalysis.story_world.world_building.length > 0 && (
                      <div>
                        <span className="font-semibold">World Building:</span>
                        <ul className="list-disc ml-5 mt-1">
                          {pitchAnalysis.story_world.world_building.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Characters Card */}
            {hasCharacters && (
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-[#4C9C9B]" />
                    <h3 className="text-lg font-semibold text-black">Characters</h3>
                  </div>
                  <div className="space-y-4">
                    {pitchAnalysis.characters?.map((char, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-black mb-1">{char.name}</div>
                        <div className="text-sm space-y-1 text-gray-700">
                          {char.role && <div><span className="font-medium">Role:</span> {char.role}</div>}
                          {char.archetype && <div><span className="font-medium">Archetype:</span> {char.archetype}</div>}
                          {char.description && <div className="mt-1">{char.description}</div>}
                          {char.key_traits && char.key_traits.length > 0 && (
                            <div className="mt-1">
                              <span className="font-medium">Traits:</span> {char.key_traits.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Themes & Tone Card */}
            {hasThemesTone && (
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-[#4C9C9B]" />
                    <h3 className="text-lg font-semibold text-black">Themes & Tone</h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    {pitchAnalysis.themes_and_tone?.primary_themes && pitchAnalysis.themes_and_tone.primary_themes.length > 0 && (
                      <div>
                        <span className="font-semibold">Primary Themes:</span> {pitchAnalysis.themes_and_tone.primary_themes.join(', ')}
                      </div>
                    )}
                    {pitchAnalysis.themes_and_tone?.emotional_tone && (
                      <div>
                        <span className="font-semibold">Emotional Tone:</span> {pitchAnalysis.themes_and_tone.emotional_tone}
                      </div>
                    )}
                    {pitchAnalysis.themes_and_tone?.visual_style && (
                      <div>
                        <span className="font-semibold">Visual Style:</span> {pitchAnalysis.themes_and_tone.visual_style}
                      </div>
                    )}
                    {pitchAnalysis.themes_and_tone?.mood_keywords && pitchAnalysis.themes_and_tone.mood_keywords.length > 0 && (
                      <div>
                        <span className="font-semibold">Mood:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pitchAnalysis.themes_and_tone.mood_keywords.map((kw, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Story Elements Card */}
            {hasStoryElements && (
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-[#4C9C9B]" />
                    <h3 className="text-lg font-semibold text-black">Story Elements</h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    {pitchAnalysis.story_elements?.logline && (
                      <div className="p-3 bg-[#4C9C9B]/5 border-l-4 border-[#4C9C9B] rounded-r">
                        <span className="font-semibold">Logline:</span> {pitchAnalysis.story_elements.logline}
                      </div>
                    )}
                    {pitchAnalysis.story_elements?.plot_summary && (
                      <div>
                        <span className="font-semibold">Plot:</span> {pitchAnalysis.story_elements.plot_summary}
                      </div>
                    )}
                    {pitchAnalysis.story_elements?.genre_blend && pitchAnalysis.story_elements.genre_blend.length > 0 && (
                      <div>
                        <span className="font-semibold">Genre Blend:</span> {pitchAnalysis.story_elements.genre_blend.join(', ')}
                      </div>
                    )}
                    {pitchAnalysis.story_elements?.narrative_structure && (
                      <div>
                        <span className="font-semibold">Structure:</span> {pitchAnalysis.story_elements.narrative_structure}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Positioning Card */}
            {hasMarketPositioning && (
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-[#4C9C9B]" />
                    <h3 className="text-lg font-semibold text-black">Market Positioning</h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    {pitchAnalysis.market_positioning?.target_audience && (
                      <div>
                        <span className="font-semibold">Target Audience:</span>
                        <div className="ml-4 mt-1 text-sm space-y-1">
                          {pitchAnalysis.market_positioning.target_audience.age_range && (
                            <div>Age: {pitchAnalysis.market_positioning.target_audience.age_range}</div>
                          )}
                          {pitchAnalysis.market_positioning.target_audience.psychographics && (
                            <div>{pitchAnalysis.market_positioning.target_audience.psychographics}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {pitchAnalysis.market_positioning?.comparable_titles && pitchAnalysis.market_positioning.comparable_titles.length > 0 && (
                      <div>
                        <span className="font-semibold">Comparables:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {pitchAnalysis.market_positioning.comparable_titles.map((comp, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {comp.title} ({comp.platform})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {pitchAnalysis.market_positioning?.platform_fit && pitchAnalysis.market_positioning.platform_fit.length > 0 && (
                      <div>
                        <span className="font-semibold">Platform Fit:</span> {pitchAnalysis.market_positioning.platform_fit.join(', ')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* IP Value Card */}
            {hasIPValue && (
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Gem className="w-5 h-5 text-[#4C9C9B]" />
                    <h3 className="text-lg font-semibold text-black">IP Value</h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    {pitchAnalysis.ip_value?.franchise_potential && (
                      <div>
                        <span className="font-semibold">Franchise Potential:</span> {pitchAnalysis.ip_value.franchise_potential}
                      </div>
                    )}
                    {pitchAnalysis.ip_value?.cross_media_potential && pitchAnalysis.ip_value.cross_media_potential.length > 0 && (
                      <div>
                        <span className="font-semibold">Cross-Media:</span>
                        <ul className="list-disc ml-5 mt-1">
                          {pitchAnalysis.ip_value.cross_media_potential.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pitchAnalysis.ip_value?.unique_selling_points && pitchAnalysis.ip_value.unique_selling_points.length > 0 && (
                      <div>
                        <span className="font-semibold">USPs:</span>
                        <ul className="list-disc ml-5 mt-1">
                          {pitchAnalysis.ip_value.unique_selling_points.map((usp, idx) => (
                            <li key={idx}>{usp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Production Details Card */}
            {hasProductionDetails && (
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Film className="w-5 h-5 text-[#4C9C9B]" />
                    <h3 className="text-lg font-semibold text-black">Production Details</h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    {pitchAnalysis.production_details?.format && (
                      <div>
                        <span className="font-semibold">Format:</span> {pitchAnalysis.production_details.format}
                      </div>
                    )}
                    {pitchAnalysis.production_details?.adaptation_type && (
                      <div>
                        <span className="font-semibold">Adaptation Type:</span> {pitchAnalysis.production_details.adaptation_type}
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
                    <FileText className="w-5 h-5 text-[#4C9C9B]" />
                    <h3 className="text-lg font-semibold text-black">Source Material</h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    {pitchAnalysis.source_material?.original_platform && (
                      <div>
                        <span className="font-semibold">Platform:</span> {pitchAnalysis.source_material.original_platform}
                      </div>
                    )}
                    {pitchAnalysis.source_material?.metrics && (
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        {pitchAnalysis.source_material.metrics.views && (
                          <div className="p-2 bg-gray-50 rounded text-center">
                            <div className="text-xs text-gray-500">Views</div>
                            <div className="font-medium">{pitchAnalysis.source_material.metrics.views}</div>
                          </div>
                        )}
                        {pitchAnalysis.source_material.metrics.chapters && (
                          <div className="p-2 bg-gray-50 rounded text-center">
                            <div className="text-xs text-gray-500">Chapters</div>
                            <div className="font-medium">{pitchAnalysis.source_material.metrics.chapters}</div>
                          </div>
                        )}
                        {pitchAnalysis.source_material.metrics.rating && (
                          <div className="p-2 bg-gray-50 rounded text-center">
                            <div className="text-xs text-gray-500">Rating</div>
                            <div className="font-medium">{pitchAnalysis.source_material.metrics.rating}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Korean Cultural Elements Card */}
            {hasKoreanCultural && (
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[#4C9C9B]" />
                    <h3 className="text-lg font-semibold text-black">Korean Cultural Elements</h3>
                  </div>
                  <ul className="list-disc ml-5 space-y-1 text-gray-700">
                    {pitchAnalysis.korean_cultural_elements?.map((element, idx) => (
                      <li key={idx}>{element}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Content Classification Card */}
            {hasContentClassification && (
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-[#4C9C9B]" />
                    <h3 className="text-lg font-semibold text-black">Content Classification</h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    {pitchAnalysis.content_classification?.maturity_rating && (
                      <div>
                        <span className="font-semibold">Maturity Rating:</span> {pitchAnalysis.content_classification.maturity_rating}
                      </div>
                    )}
                    {pitchAnalysis.content_classification?.content_warnings && pitchAnalysis.content_classification.content_warnings.length > 0 && (
                      <div>
                        <span className="font-semibold">Content Warnings:</span> {pitchAnalysis.content_classification.content_warnings.join(', ')}
                      </div>
                    )}
                    {pitchAnalysis.content_classification?.complexity_score !== undefined && (
                      <div>
                        <span className="font-semibold">Complexity:</span> {pitchAnalysis.content_classification.complexity_score}/10
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </TierGatedContent>
  );
}
