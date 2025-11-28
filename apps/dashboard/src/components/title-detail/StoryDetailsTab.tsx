import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TierGatedContent } from '@/components/tier/TierGatedContent';
import { Title, CharacterDetail } from '@/services/titlesService';
import { type PitchAnalysis } from '@/types/pitchAnalysis';
import { AIInsightCard } from './AIInsightCard';
import {
  Palette,
  Globe,
  Lightbulb,
  Users,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface StoryDetailsTabProps {
  title: Title;
  pitchAnalysis?: PitchAnalysis | null;
}

// Character card component
function CharacterCard({ character }: { character: CharacterDetail }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const roleColors: Record<string, string> = {
    protagonist: 'bg-blue-100 text-blue-700 border-blue-200',
    antagonist: 'bg-red-100 text-red-700 border-red-200',
    supporting: 'bg-green-100 text-green-700 border-green-200',
    minor: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-black">
            {character.name}
            {character.name_kr && (
              <span className="text-gray-500 font-normal ml-2">({character.name_kr})</span>
            )}
          </div>
          <Badge className={`text-xs mt-1 ${roleColors[character.role] || roleColors.minor}`}>
            {character.role}
          </Badge>
        </div>
        {(character.background || character.personality || character.arc || character.relationships) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        )}
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        {character.age && <span className="mr-3">Age: {character.age}</span>}
        {character.gender && <span className="mr-3">{character.gender}</span>}
        {character.occupation && <span>{character.occupation}</span>}
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-sm space-y-2">
          {character.background && (
            <div>
              <span className="font-medium text-gray-700">Background:</span>
              <p className="text-gray-600 mt-0.5">{character.background}</p>
            </div>
          )}
          {character.personality && (
            <div>
              <span className="font-medium text-gray-700">Personality:</span>
              <p className="text-gray-600 mt-0.5">{character.personality}</p>
            </div>
          )}
          {character.arc && (
            <div>
              <span className="font-medium text-gray-700">Character Arc:</span>
              <p className="text-gray-600 mt-0.5">{character.arc}</p>
            </div>
          )}
          {character.relationships && (
            <div>
              <span className="font-medium text-gray-700">Relationships:</span>
              <p className="text-gray-600 mt-0.5">{character.relationships}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StoryDetailsTab({ title, pitchAnalysis }: StoryDetailsTabProps) {
  const [showAllCharacters, setShowAllCharacters] = useState(false);

  const hasThemesContent = title.tone || title.important_issues;
  const hasWorldContent = title.setting_description || title.world_lore || title.supernatural_concepts;
  const hasCharacters = title.character_details && title.character_details.length > 0;
  const hasNarrativeContent = title.story_structure || title.narrative_arc || title.planned_ending;

  // AI Pitch Analysis availability checks
  const hasAIStoryWorld = pitchAnalysis?.story_world && (
    pitchAnalysis.story_world.setting ||
    pitchAnalysis.story_world.time_period ||
    pitchAnalysis.story_world.world_building?.length
  );
  const hasAICharacters = pitchAnalysis?.characters && pitchAnalysis.characters.length > 0;
  const hasAIThemesTone = pitchAnalysis?.themes_and_tone && (
    pitchAnalysis.themes_and_tone.primary_themes?.length ||
    pitchAnalysis.themes_and_tone.emotional_tone ||
    pitchAnalysis.themes_and_tone.visual_style
  );
  const hasAIStoryElements = pitchAnalysis?.story_elements && (
    pitchAnalysis.story_elements.logline ||
    pitchAnalysis.story_elements.plot_summary ||
    pitchAnalysis.story_elements.genre_blend?.length
  );
  const hasAIKoreanCultural = pitchAnalysis?.korean_cultural_elements && pitchAnalysis.korean_cultural_elements.length > 0;

  const displayedCharacters = showAllCharacters
    ? title.character_details
    : title.character_details?.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Tone & Themes Card */}
      {hasThemesContent && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Tone & Themes</h3>
            </div>

            <div className="space-y-4">
              {title.tone && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Tone</div>
                  <div className="font-medium text-black">{title.tone}</div>
                </div>
              )}

              {title.important_issues && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Key Themes & Issues</div>
                  <p className="text-gray-700">{title.important_issues}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* World & Setting Card */}
      {hasWorldContent && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">World & Setting</h3>
            </div>

            <div className="space-y-4">
              {title.setting_description && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Setting</div>
                  <p className="text-gray-700">{title.setting_description}</p>
                </div>
              )}

              {title.world_lore && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">World Building & Lore</div>
                  <p className="text-gray-700">{title.world_lore}</p>
                </div>
              )}

              {title.supernatural_concepts && (
                <div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Supernatural Elements
                  </div>
                  <p className="text-gray-700">{title.supernatural_concepts}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspiration Card */}
      {title.inspiration && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Inspiration</h3>
            </div>
            <p className="text-gray-700 italic">"{title.inspiration}"</p>
          </CardContent>
        </Card>
      )}

      {/* Characters Card */}
      {hasCharacters && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Key Characters</h3>
              <span className="text-sm text-gray-500">
                ({title.character_details!.length} characters)
              </span>
            </div>

            <div className="space-y-3">
              {displayedCharacters?.map((character, idx) => (
                <CharacterCard key={idx} character={character} />
              ))}
            </div>

            {title.character_details!.length > 3 && (
              <Button
                variant="ghost"
                className="w-full mt-4 text-[#4C9C9B] hover:text-[#4C9C9B]/80 hover:bg-[#4C9C9B]/5"
                onClick={() => setShowAllCharacters(!showAllCharacters)}
              >
                {showAllCharacters ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show All {title.character_details!.length} Characters
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Narrative Structure Card - PRO Gated */}
      {hasNarrativeContent && (
        <TierGatedContent requiredTier="pro">
          <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-[#4C9C9B]" />
                <h3 className="text-lg font-semibold text-black">Narrative Structure</h3>
                <Badge className="bg-[#AF52DE]/10 text-[#AF52DE] text-xs">PRO</Badge>
              </div>

              <div className="space-y-4">
                {title.story_structure && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Story Structure</div>
                    <p className="text-gray-700">{title.story_structure}</p>
                  </div>
                )}

                {title.narrative_arc && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Narrative Arc</div>
                    <p className="text-gray-700">{title.narrative_arc}</p>
                  </div>
                )}

                {title.planned_ending && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Planned Ending</div>
                    <p className="text-gray-700">{title.planned_ending}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TierGatedContent>
      )}

      {/* AI Insight Cards Section */}
      {(hasAIStoryWorld || hasAIStoryElements || hasAIThemesTone || hasAICharacters || hasAIKoreanCultural) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Story World Card */}
          {hasAIStoryWorld && (
            <AIInsightCard
              title="Story World"
              icon={<Globe className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <div className="space-y-3 text-gray-700">
                {pitchAnalysis!.story_world.setting && (
                  <div>
                    <span className="font-semibold">Setting:</span> {pitchAnalysis!.story_world.setting}
                  </div>
                )}
                {pitchAnalysis!.story_world.time_period && (
                  <div>
                    <span className="font-semibold">Time Period:</span> {pitchAnalysis!.story_world.time_period}
                  </div>
                )}
                {pitchAnalysis!.story_world.world_building && pitchAnalysis!.story_world.world_building.length > 0 && (
                  <div>
                    <span className="font-semibold">World Building:</span>
                    <ul className="list-disc ml-5 mt-1 text-sm">
                      {pitchAnalysis!.story_world.world_building.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AIInsightCard>
          )}

          {/* AI Story Elements Card */}
          {hasAIStoryElements && (
            <AIInsightCard
              title="Story Elements"
              icon={<BookOpen className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <div className="space-y-3 text-gray-700">
                {pitchAnalysis!.story_elements.logline && (
                  <div className="p-3 bg-[#4C9C9B]/5 border-l-4 border-[#4C9C9B] rounded-r">
                    <span className="font-semibold">Logline:</span> {pitchAnalysis!.story_elements.logline}
                  </div>
                )}
                {pitchAnalysis!.story_elements.plot_summary && (
                  <div>
                    <span className="font-semibold">Plot:</span> {pitchAnalysis!.story_elements.plot_summary}
                  </div>
                )}
                {pitchAnalysis!.story_elements.genre_blend && pitchAnalysis!.story_elements.genre_blend.length > 0 && (
                  <div>
                    <span className="font-semibold">Genre Blend:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pitchAnalysis!.story_elements.genre_blend.map((genre, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {pitchAnalysis!.story_elements.narrative_structure && (
                  <div>
                    <span className="font-semibold">Structure:</span> {pitchAnalysis!.story_elements.narrative_structure}
                  </div>
                )}
              </div>
            </AIInsightCard>
          )}

          {/* AI Themes & Tone Card */}
          {hasAIThemesTone && (
            <AIInsightCard
              title="Themes & Tone"
              icon={<Palette className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <div className="space-y-3 text-gray-700">
                {pitchAnalysis!.themes_and_tone.primary_themes && pitchAnalysis!.themes_and_tone.primary_themes.length > 0 && (
                  <div>
                    <span className="font-semibold">Primary Themes:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pitchAnalysis!.themes_and_tone.primary_themes.map((theme, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {pitchAnalysis!.themes_and_tone.emotional_tone && (
                  <div>
                    <span className="font-semibold">Emotional Tone:</span> {pitchAnalysis!.themes_and_tone.emotional_tone}
                  </div>
                )}
                {pitchAnalysis!.themes_and_tone.visual_style && (
                  <div>
                    <span className="font-semibold">Visual Style:</span> {pitchAnalysis!.themes_and_tone.visual_style}
                  </div>
                )}
                {pitchAnalysis!.themes_and_tone.mood_keywords && pitchAnalysis!.themes_and_tone.mood_keywords.length > 0 && (
                  <div>
                    <span className="font-semibold">Mood:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pitchAnalysis!.themes_and_tone.mood_keywords.map((kw, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AIInsightCard>
          )}

          {/* AI Characters Card */}
          {hasAICharacters && (
            <AIInsightCard
              title="Characters"
              icon={<Users className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <div className="space-y-3">
                {pitchAnalysis!.characters.map((char, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-black mb-1">{char.name}</div>
                    <div className="text-sm space-y-1 text-gray-700">
                      {char.role && (
                        <Badge
                          className={`text-xs ${
                            char.role === 'protagonist'
                              ? 'bg-blue-100 text-blue-700'
                              : char.role === 'antagonist'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {char.role}
                        </Badge>
                      )}
                      {char.archetype && <div><span className="font-medium">Archetype:</span> {char.archetype}</div>}
                      {char.description && <div className="mt-1 text-gray-600">{char.description}</div>}
                      {char.key_traits && char.key_traits.length > 0 && (
                        <div className="mt-1">
                          <span className="font-medium">Traits:</span> {char.key_traits.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AIInsightCard>
          )}

          {/* AI Korean Cultural Elements Card */}
          {hasAIKoreanCultural && (
            <AIInsightCard
              title="Korean Cultural Elements"
              icon={<Sparkles className="w-5 h-5 text-[#4C9C9B]" />}
            >
              <ul className="list-disc ml-5 space-y-1 text-gray-700">
                {pitchAnalysis!.korean_cultural_elements.map((element, idx) => (
                  <li key={idx}>{element}</li>
                ))}
              </ul>
            </AIInsightCard>
          )}
        </div>
      )}

      {/* No content message */}
      {!hasThemesContent && !hasWorldContent && !title.inspiration && !hasCharacters && !hasNarrativeContent &&
       !hasAIStoryWorld && !hasAIStoryElements && !hasAIThemesTone && !hasAICharacters && !hasAIKoreanCultural && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No story details available for this title.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
